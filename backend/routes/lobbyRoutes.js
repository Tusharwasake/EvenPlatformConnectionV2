import express from "express";
import {
  createLobby,
  getAllLobbies,
  getLobbyById,
  getLobbiesByEvent,
  updateLobby,
  deleteLobby,
  joinLobby,
  leaveLobby,
  getMyLobbies,
  getActiveLobbies,
} from "../controllers/lobbyController.js";
import { authentication, isAdmin } from "../middleware/authMiddleware.js";

const lobbyRoutes = express.Router();

// Admin routes
lobbyRoutes.get("/", authentication, isAdmin, getAllLobbies);

// Protected routes - require authentication
lobbyRoutes.post("/", authentication, createLobby);
lobbyRoutes.get("/my-lobbies", authentication, getMyLobbies);
lobbyRoutes.get("/:id", authentication, getLobbyById);
lobbyRoutes.put("/:id", authentication, updateLobby);
lobbyRoutes.delete("/:id", authentication, deleteLobby);
lobbyRoutes.post("/:lobbyId/join", authentication, joinLobby);
lobbyRoutes.post("/:lobbyId/leave", authentication, leaveLobby);

// Public routes
lobbyRoutes.get("/event/:eventId", getLobbiesByEvent);
lobbyRoutes.get("/event/:eventId/active", getActiveLobbies);

export default lobbyRoutes;
