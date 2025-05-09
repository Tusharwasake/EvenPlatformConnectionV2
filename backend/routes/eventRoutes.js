// routes/eventRoutes.js
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
  getFeaturedEvents,
  searchEvents,
  addEventReview,
  getEventReviews,
  cancelEvent,
  getOrganizerStats,
} from "../controllers/eventControllers.js";
import { authentication, isAdmin } from "../middleware/authMiddleware.js";

const eventRouter = express.Router();

// Public routes (no authentication required)
eventRouter.get("/", getAllEvents);
eventRouter.get("/search", searchEvents);
eventRouter.get("/featured", getFeaturedEvents);
eventRouter.get("/category/:category", getEventsByCategory);
eventRouter.get("/upcoming", getUpcomingEvents);
eventRouter.get("/past", getPastEvents);

// Routes with path parameters (id, userId) - order matters!
eventRouter.get("/user/:userId", authentication, getEventsByUser);
eventRouter.get("/:id", getEventById);
eventRouter.get("/:id/reviews", getEventReviews);

// Protected routes (require authentication)
eventRouter.post("/", authentication, createEvent);
eventRouter.put("/:id", authentication, updateEvent);
eventRouter.delete("/:id", authentication, deleteEvent);
eventRouter.patch("/:id/cancel", authentication, cancelEvent);
eventRouter.post("/:id/reviews", authentication, addEventReview);

// Organizer dashboard
eventRouter.get("/organizer/stats", authentication, getOrganizerStats);

// Admin-only routes
eventRouter.get("/admin/all", authentication, isAdmin, getAllEvents);

export { eventRouter };
