import { lobbyModel } from "../models/lobbyEventModel.js";
import { eventModel } from "../models/eventModel.js";
import { participantModel } from "../models/participantsModel.js";
import mongoose from "mongoose";
// Create a new lobby
export const createLobby = async (req, res) => {
  try {
    const {
      name,
      eventId,
      description,
      maxParticipants,
      startTime,
      endTime,
      meetingUrl,
      lobbyType,
    } = req.body;

    // Validate required fields
    if (!name || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Name and eventId are required",
      });
    }

    // Check if event exists
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Create new lobby
    const newLobby = new lobbyModel({
      name,
      eventId,
      description,
      maxParticipants: maxParticipants || 0,
      participants: [],
      createdBy: req.user.userId,
      startTime,
      endTime,
      meetingUrl,
      lobbyType: lobbyType || "general",
    });

    const savedLobby = await newLobby.save();

    res.status(201).json({
      success: true,
      message: "Lobby created successfully",
      data: savedLobby,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all lobbies
export const getAllLobbies = async (req, res) => {
  try {
    const lobbies = await lobbyModel
      .find()
      .populate("eventId", "name startDate endDate")
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    res.status(200).json({
      success: true,
      count: lobbies.length,
      data: lobbies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get lobby by ID
export const getLobbyById = async (req, res) => {
  try {
    const lobby = await lobbyModel
      .findById(req.params.id)
      .populate("eventId", "name startDate endDate")
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    res.status(200).json({
      success: true,
      data: lobby,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get lobbies by event ID
export const getLobbiesByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Check if event exists
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const lobbies = await lobbyModel
      .find({ eventId })
      .populate("createdBy", "name email")
      .populate("eventId", "name startDate endDate");

    res.status(200).json({
      success: true,
      count: lobbies.length,
      data: lobbies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update lobby
export const updateLobby = async (req, res) => {
  try {
    const lobbyId = req.params.id;
    const updateData = req.body;

    // Find lobby first to verify ownership
    const lobby = await lobbyModel.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Check if user is the creator of the lobby or an admin
    if (
      req.user.role !== "organizer" &&
      lobby.createdBy.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this lobby",
      });
    }

    // Prevent updating participants directly through this endpoint
    if (updateData.participants) {
      delete updateData.participants;
    }

    const updatedLobby = await lobbyModel
      .findByIdAndUpdate(lobbyId, updateData, {
        new: true,
        runValidators: true,
      })
      .populate("eventId", "name startDate endDate")
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    res.status(200).json({
      success: true,
      message: "Lobby updated successfully",
      data: updatedLobby,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete lobby
export const deleteLobby = async (req, res) => {
  try {
    const lobbyId = req.params.id;

    // Find lobby first to verify ownership
    const lobby = await lobbyModel.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Check if user is the creator of the lobby or an admin
    if (
      req.user.role !== "organizer" &&
      lobby.createdBy.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this lobby",
      });
    }

    await lobbyModel.findByIdAndDelete(lobbyId);

    res.status(200).json({
      success: true,
      message: "Lobby deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinLobby = async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { code } = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!lobbyId || !code) {
      return res.status(400).json({
        success: false,
        message: "Lobby ID and verification code are required",
      });
    }

    // Find the lobby with populated event details
    const lobby = await lobbyModel
      .findById(lobbyId)
      .populate("eventId", "name startDate endDate");

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Debug information
    // console.log("Join attempt:", {
    //   userId,
    //   lobbyId,
    //   eventId: lobby.eventId?._id || lobby.eventId,
    //   codeProvided: code,
    // });

    // Check if lobby is active
    if (!lobby.isActive) {
      return res.status(400).json({
        success: false,
        message: "This lobby is no longer active",
      });
    }

    // Check if lobby is full
    if (lobby.isFull) {
      return res.status(400).json({
        success: false,
        message: "This lobby is full",
      });
    }

    // Check if user is already in the lobby - use the schema method
    if (lobby.hasParticipant(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already in this lobby",
      });
    }

    // Get event ID from the lobby
    const eventId = lobby.eventId?._id || lobby.eventId;

    if (!eventId) {
      return res.status(500).json({
        success: false,
        message: "Lobby has invalid event reference",
      });
    }

    // Find participant record with diagnostic logging
    console.log("Looking for participant with:", {
      userId,
      eventId: eventId,
      code,
    });

    // Verify the participant code
    const participant = await participantModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      eventId: new mongoose.Types.ObjectId(eventId.toString()),
      code: code,
    });

    console.log(
      "Participant search result:",
      participant ? "Found" : "Not found"
    );

    // If no participant found, try to find any participant for this user and event
    if (!participant) {
      const anyParticipant = await participantModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        eventId: new mongoose.Types.ObjectId(eventId.toString()),
      });

      // console.log(
      //   "Any participant for this user/event:",
      //   anyParticipant ? `Found with code ${anyParticipant.code}` : "None found"
      // );

      // Check if there's a different event ID issue
      const participantWithCode = await participantModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        code,
      });

      // if (participantWithCode) {
      //   console.log(
      //     "Found participant with correct code but different eventId:",
      //     participantWithCode.eventId.toString()
      //   );
      // }

      return res.status(401).json({
        success: false,
        message: "Invalid verification code or not registered for this event",
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Add user to the lobby participants array
      lobby.participants.push(userId);

      // Update the lobby with the new participant
      await lobby.save({ session });

      // If max participants is set and we've reached that limit, mark lobby as full
      if (
        lobby.maxParticipants > 0 &&
        lobby.participants.length >= lobby.maxParticipants
      ) {
        lobby.isFull = true;
        await lobby.save({ session });
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Return success response with updated lobby data
      return res.status(200).json({
        success: true,
        message: "Successfully joined the lobby",
        data: {
          lobbyId: lobby._id,
          lobbyName: lobby.name,
          eventId: eventId,
          eventName: lobby.eventId?.name || "Event",
        },
      });
    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error joining lobby:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join lobby",
      error: error.message,
    });
  }
};

// Leave lobby
export const leaveLobby = async (req, res) => {
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

    // Check if user is in the lobby
    if (!lobby.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are not in this lobby",
      });
    }

    // Remove user from lobby
    lobby.participants = lobby.participants.filter(
      (participantId) => participantId.toString() !== userId.toString()
    );
    await lobby.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the lobby",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get lobbies by participant (user)
export const getMyLobbies = async (req, res) => {
  try {
    const userId = req.user.userId;

    const lobbies = await lobbyModel
      .find({ participants: userId })
      .populate("eventId", "name startDate endDate")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      count: lobbies.length,
      data: lobbies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get active lobbies (for an event)
export const getActiveLobbies = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const currentTime = new Date();

    // Find active lobbies with current time between start and end times
    // or lobbies with no specific time constraints that are marked as active
    const lobbies = await lobbyModel
      .find({
        eventId,
        isActive: true,
        $or: [
          {
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime },
          },
          {
            startTime: { $exists: false },
          },
          {
            endTime: { $exists: false },
          },
        ],
      })
      .populate("createdBy", "name email")
      .populate("eventId", "name startDate endDate");

    res.status(200).json({
      success: true,
      count: lobbies.length,
      data: lobbies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
