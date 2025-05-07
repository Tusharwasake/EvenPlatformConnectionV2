import { participantModel } from "../models/participantsModel.js";
import { lobbyModel } from "../models/lobbyEventModel.js";

const otpCheckerMiddleware = async (req, res, next) => {
  const { userId, groupId } = req.params;
  const { inputCode } = req.body;

  if (!userId || !groupId || !inputCode) {
    return res.status(400).json({
      success: false,
      message: "Missing required parameters: userId, groupId, or inputCode",
    });
  }

  try {
    // Find participant by userId
    const participants = await participantModel.find({ userId: userId });

    if (!participants || participants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No participants found for this user",
      });
    }

    // Check if inputCode matches any of the user's participant codes
    const matchingParticipant = participants.find(
      (participant) => participant.code === parseInt(inputCode)
    );

    if (!matchingParticipant) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP code",
      });
    }

    // Add user to the group pool
    const groupLobby = await lobbyModel.findById(groupId);
    if (!groupLobby) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is already in the participants array
    if (groupLobby.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already in the group",
      });
    }

    groupLobby.participants.push(userId);
    await groupLobby.save();

    // Add the participant and group info to the request object
    req.participant = matchingParticipant;
    req.groupLobby = groupLobby;

    // Continue to the next middleware or controller
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { otpCheckerMiddleware };
