import { participantModel } from "../models/participantModel.js";
import { lobbyModel } from "../models/lobbyEventModel.js";

// Middleware to verify OTP and presence status before granting lobby access
export const verifyLobbyAccess = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const { otp } = req.body;
    const userId = req.user.userId;

    // Check if OTP is provided
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required to access the lobby",
      });
    }

    // Find the lobby
    const lobby = await lobbyModel.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Check if lobby is active
    if (!lobby.isActive) {
      return res.status(403).json({
        success: false,
        message: "This lobby is no longer active",
      });
    }

    // Find the participant with matching userId, eventId and OTP
    const participant = await participantModel.findOne({
      userId: userId,
      eventId: lobby.eventId,
      code: otp,
    });

    if (!participant) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP or you are not registered for this event",
      });
    }

    // Check if participant is marked as present
    if (!participant.isPresent) {
      return res.status(403).json({
        success: false,
        message:
          "You must be marked as present by the event manager to access the lobby",
      });
    }

    // Update participant's lobby access information
    const now = new Date();
    if (!participant.hasAccessedLobby) {
      participant.hasAccessedLobby = true;
      participant.firstLobbyAccess = now;
    }
    participant.lastLobbyAccess = now;
    await participant.save();

    // Add user to lobby participants if not already there
    if (!lobby.participants.includes(userId)) {
      lobby.participants.push(userId);
      await lobby.save();
    }

    // Add participant and lobby info to request object for use in next middleware/controller
    req.participant = participant;
    req.eventLobby = lobby;

    next();
  } catch (error) {
    console.error("Error verifying lobby access:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify lobby access",
      error: error.message,
    });
  }
};

// Middleware to check if user is already in the lobby (no OTP required for subsequent access)
export const checkExistingLobbyAccess = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user.userId;

    // Find the lobby
    const lobby = await lobbyModel.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Check if user is already in the lobby
    const isParticipant = lobby.participants.some(
      (participantId) => participantId.toString() === userId.toString()
    );

    if (isParticipant) {
      // Find the participant to update access time
      const participant = await participantModel.findOne({
        userId: userId,
        eventId: lobby.eventId,
      });

      if (participant) {
        // Update access time
        participant.lastLobbyAccess = new Date();
        await participant.save();

        // Add to request object
        req.participant = participant;
        req.eventLobby = lobby;

        // Skip OTP verification
        return next();
      }
    }

    // If not in lobby or participant not found, continue to OTP verification
    return res.status(401).json({
      success: false,
      message: "OTP required for lobby access",
      requiresOTP: true,
    });
  } catch (error) {
    console.error("Error checking lobby access:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check lobby access",
      error: error.message,
    });
  }
};

// Middleware to set up auto-deletion of lobbies
export const setupLobbyAutoDeletion = async (req, res, next) => {
  try {
    // This would typically be set up as a scheduled job (cron) in a production environment
    // For now, we'll implement a function that can be called manually or scheduled

    const currentDate = new Date();

    // Find events that ended more than 15 days ago
    const fifteenDaysAgo = new Date(currentDate);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Find lobbies for events that ended more than 15 days ago
    const lobbiesForDeletion = await lobbyModel.find().populate({
      path: "eventId",
      match: { endDate: { $lt: fifteenDaysAgo } },
    });

    // Filter out lobbies where population didn't match (null eventId)
    const eligibleLobbies = lobbiesForDeletion.filter((lobby) => lobby.eventId);

    // Delete eligible lobbies
    if (eligibleLobbies.length > 0) {
      console.log(`Deleting ${eligibleLobbies.length} expired lobbies`);

      for (const lobby of eligibleLobbies) {
        await lobbyModel.findByIdAndDelete(lobby._id);
      }
    }

    next();
  } catch (error) {
    console.error("Error in lobby auto-deletion:", error);
    // Continue to next middleware even if this fails
    next();
  }
};
