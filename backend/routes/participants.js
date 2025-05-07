import express from "express";
import {
  getAllParticipants,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipantsByEvent,
  verifyParticipantCode,
  registerParticipant,
} from "../controllers/participantController.js";
import { authentication, isAdmin } from "../middleware/authMiddleware.js";
import { otpCheckerMiddleware } from "../middleware/otpMiddleware.js";
import { joinGroupAuthentication } from "../middleware/joinGroupAuthentication.js";

const participantRouter = express.Router();

// Get all participants - Admin only
participantRouter.get("/", authentication, isAdmin, getAllParticipants);

// Get participant by ID - Protected route
participantRouter.get("/:id", authentication, getParticipantById);

// Create new participant - Admin only
participantRouter.post("/", authentication, isAdmin, createParticipant);

// Register as a participant (for users) - Protected route
participantRouter.post("/register", authentication, registerParticipant);

// Update participant - Admin only
participantRouter.put("/:id", authentication, isAdmin, updateParticipant);

// Delete participant - Admin only
participantRouter.delete("/:id", authentication, isAdmin, deleteParticipant);

// Get participants by event ID - Protected route
participantRouter.get(
  "/event/:eventId",
  authentication,
  getParticipantsByEvent
);

// Verify participant code - Public route (no authentication required)
participantRouter.post("/verify", verifyParticipantCode);

// Join group with OTP - Protected route
participantRouter.post(
  "/join/:groupId",
  authentication,
  joinGroupAuthentication,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Successfully joined the group",
      participant: req.participant,
    });
  }
);

// Add participant to lobby with OTP check - Protected route
participantRouter.post(
  "/lobby/:userId/:groupId",
  authentication,
  otpCheckerMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "User added to the group pool",
      participant: req.participant,
      groupLobby: req.groupLobby,
    });
  }
);

export { participantRouter };
