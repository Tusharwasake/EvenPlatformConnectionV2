import express from "express";
import {
  markAttendance,
  markBulkAttendance,
  getEventAttendance,
  checkAttendanceStatus,
} from "../controllers/attendanceController.js";
import { authentication, isAdmin } from "../middleware/authMiddleware.js";

const attendanceRoutes = express.Router();

// All attendance routes require authentication
attendanceRoutes.use(authentication);

// Mark a single participant as present
attendanceRoutes.post("/mark", markAttendance);

// Mark multiple participants as present
attendanceRoutes.post("/mark-bulk", markBulkAttendance);

// Get attendance status for an event
attendanceRoutes.get("/event/:eventId", getEventAttendance);

// Check attendance status for a specific user in an event
attendanceRoutes.get("/check/:userId/:eventId", checkAttendanceStatus);

export default attendanceRoutes;
