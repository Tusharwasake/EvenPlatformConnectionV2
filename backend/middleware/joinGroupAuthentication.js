import { participantModel } from "../models/participantsModel.js";

const joinGroupAuthentication = async (req, res, next) => {
  const userId = req.user.userId;
  const groupId = req.params.groupId;
  const enterOtp = req.body.otp;

  if (!userId || !groupId) {
    return res.status(400).json({
      success: false,
      message: "Missing UserID or groupId",
    });
  }

  if (!enterOtp) {
    return res.status(400).json({
      success: false,
      message: "OTP is required",
    });
  }

  try {
    const participant = await participantModel.findOne({
      userId: userId,
      eventId: groupId,
      code: parseInt(enterOtp),
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Invalid OTP or participant not found for this event",
      });
    }

    // Add participant to request object for use in the next middleware/controller
    req.participant = participant;
    next();
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export { joinGroupAuthentication };
