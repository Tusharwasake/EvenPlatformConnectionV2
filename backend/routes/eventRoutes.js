import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByCategory,
  getEventsByUser,
  getUpcomingEvents,
  getPastEvents,
} from "../controllers/eventControllers.js";
import { authentication, isAdmin } from "../middleware/authMiddleware.js";

const eventRouter = express.Router();

// Public routes
eventRouter.get("/", getAllEvents);
eventRouter.get("/:id", getEventById);
eventRouter.get("/category/:category", getEventsByCategory);
eventRouter.get("/upcoming/events", getUpcomingEvents);
eventRouter.get("/past/events", getPastEvents);

// Protected routes (require authentication)
eventRouter.post("/", authentication, createEvent);
eventRouter.put("/:id", authentication, updateEvent);
eventRouter.delete("/:id", authentication, deleteEvent);
eventRouter.get("/user/:userId", authentication, getEventsByUser);

export { eventRouter };
