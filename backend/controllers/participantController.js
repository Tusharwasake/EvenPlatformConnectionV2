import { participantModel } from "../models/participantsModel.js";
import { eventModel } from "../models/eventModel.js";
import * as mailsender from "../emailSender/emailSender.js";
import "dotenv/config";

// Generate a unique code and send email with the code
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    const existingParticipant = await participantModel.findOne({ code });

    if (!existingParticipant) {
      isUnique = true;
    }
  }

  // Send email with the code
  mailsender(process.env.GMAIL, "Your Event Verification Code", code);
  return code;
};

// Register as a participant for an event
export const registerParticipant = async (req, res) => {
  try {
    const code = await generateUniqueCode();
    const eventId = req.body.eventId;
    const userId = req.user.userId;

    const newParticipant = await participantModel.create({
      eventId: eventId,
      userId: userId,
      code: code,
      phone: req.body.phone || "",
    });

    // Increment participant count in the event model
    await eventModel.findByIdAndUpdate(eventId, {
      $inc: { participantCount: 1 },
    });

    res.status(200).json({
      success: true,
      message: "Registered as participant successfully",
      data: newParticipant,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all participants
export const getAllParticipants = async (req, res) => {
  try {
    const participants = await participantModel
      .find()
      .populate("userId", "name email")
      .populate("eventId", "title date");

    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve participants",
      error: error.message,
    });
  }
};

// Get participant by ID
export const getParticipantById = async (req, res) => {
  try {
    const participant = await participantModel
      .findById(req.params.id)
      .populate("userId", "name email")
      .populate("eventId", "title date");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // Check if the requesting user is the participant or an admin
    if (
      req.user.role !== "organizer" &&
      req.user.userId !== participant.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this participant",
      });
    }

    res.status(200).json({
      success: true,
      data: participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve participant",
      error: error.message,
    });
  }
};

// Create new participant (Admin function)
export const createParticipant = async (req, res) => {
  try {
    // Generate a random 6-digit code
    const generateAdminCode = async () => {
      const code = Math.floor(100000 + Math.random() * 900000);
      const existingCode = await participantModel.findOne({ code });
      if (existingCode) {
        return generateAdminCode(); // Recursively try again if code exists
      }
      return code;
    };

    const newParticipant = new participantModel({
      userId: req.body.userId,
      eventId: req.body.eventId,
      phone: req.body.phone,
      code: await generateAdminCode(),
    });

    const savedParticipant = await newParticipant.save();

    // Increment participant count in the event model
    await eventModel.findByIdAndUpdate(req.body.eventId, {
      $inc: { participantCount: 1 },
    });

    res.status(201).json({
      success: true,
      data: savedParticipant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create participant",
      error: error.message,
    });
  }
};

// Update participant
export const updateParticipant = async (req, res) => {
  try {
    const updatedParticipant = await participantModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedParticipant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedParticipant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update participant",
      error: error.message,
    });
  }
};

// Delete participant
export const deleteParticipant = async (req, res) => {
  try {
    const participant = await participantModel.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    // Decrement participant count in the event model
    await eventModel.findByIdAndUpdate(participant.eventId, {
      $inc: { participantCount: -1 },
    });

    const deletedParticipant = await participantModel.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Participant deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete participant",
      error: error.message,
    });
  }
};

// Get participants by event ID
export const getParticipantsByEvent = async (req, res) => {
  try {
    const participants = await participantModel
      .find({ eventId: req.params.eventId })
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve participants for this event",
      error: error.message,
    });
  }
};

// Verify participant code
export const verifyParticipantCode = async (req, res) => {
  try {
    const { code, eventId } = req.body;

    if (!code || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Code and eventId are required",
      });
    }

    const participant = await participantModel.findOne({
      code: code.toString(),
      eventId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Invalid code or participant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify participant",
      error: error.message,
    });
  }
};
