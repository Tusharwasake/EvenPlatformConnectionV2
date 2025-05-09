import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

// Database connection
import { db } from "./database/datatase.js";

// Import routes
import { router as authRouter } from "./routes/auth.js";
import { participantRouter } from "./routes/participants.js";
import { eventRouter } from "./routes/eventRoutes.js";
import { filterRoutes } from "./routes/filterRoutes.js";

import lobbyRoutes from "./routes/lobbyRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// WebSocket setup
import setupWebSocket from "./websocketSetup.js";

// Import lobby cleanup service
import lobbyCleanupService from "./services/lobbyCleanupService.js";

// Import security middleware
import { configureSecurityMiddleware } from "./middleware/securityMiddleware.js";
import { protect, refreshToken } from "./middleware/jwtMiddleware.js";
import { authentication, isAdmin } from "./middleware/authMiddleware.js";
import { healthRouter } from "./routes/healthRoutes.js";

// Environment variables
const SERVER_PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Apply security middleware (must be applied before other middleware)
configureSecurityMiddleware(app);

// Basic middleware
app.use(express.json({ limit: "10kb" })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Configure CORS with more secure options
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Refreshed-Token"], // For token refresh
  })
);

// Set up Socket.io
const io = setupWebSocket(server);

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(refreshToken);
app.use("/health", healthRouter);

// API routes with appropriate security middleware
app.use("/user", authRouter);

// All other routes require authentication
app.use("/participants", protect, participantRouter);
app.use("/events", eventRouter); // Some routes public, others protected in the router
app.use("/filter", filterRoutes);
app.use("/lobbies", lobbyRoutes); // Mix of public/protected routes
app.use("/attendance", protect, attendanceRoutes);
app.use("/friends", protect, friendRoutes);
app.use("/chat", protect, chatRoutes);

// Add an admin route to manually trigger lobby cleanup
app.post("/admin/cleanup-lobbies", protect, isAdmin, async (req, res) => {
  try {
    await lobbyCleanupService.runCleanupNow();
    res.status(200).json({
      success: true,
      message: "Lobby cleanup task executed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to execute lobby cleanup task",
      error: NODE_ENV === "production" ? undefined : error.message,
    });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Event Management API is running!");
});

// Security check route
app.get("/security-check", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Security check passed",
    environment: NODE_ENV,
    securityHeaders: {
      contentSecurityPolicy: Boolean(res.getHeader("Content-Security-Policy")),
      xContentTypeOptions: Boolean(res.getHeader("X-Content-Type-Options")),
      xFrameOptions: Boolean(res.getHeader("X-Frame-Options")),
      xXssProtection: Boolean(res.getHeader("X-XSS-Protection")),
      hsts: Boolean(res.getHeader("Strict-Transport-Security")),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler middleware with improved security
app.use((err, req, res, next) => {
  const errorId =
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Log error details for server-side debugging
  console.error(`[ERROR ${errorId}] ${new Date().toISOString()}:`, err);

  const statusCode = err.statusCode || 500;

  // Send sanitized error response to client
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    errorId: errorId, // For support reference
    error: NODE_ENV === "production" ? undefined : err.stack,
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await db();
    console.log("✅ Database connected successfully");

    // Start the lobby cleanup service
    lobbyCleanupService.startScheduledJob();
    console.log("✅ Lobby cleanup service started");

    // Run initial cleanup to handle any lobbies that should have been deleted during downtime
    await lobbyCleanupService.runCleanupNow();

    // Start the server
    server.listen(SERVER_PORT, () => {
      console.log(
        `✅ Server running in ${NODE_ENV} mode at http://localhost:${SERVER_PORT}`
      );

      // Log security warning in development mode
      if (NODE_ENV !== "production") {
        console.log(
          "⚠️  Running in development mode - some security features may be disabled"
        );
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle application shutdown
const gracefulShutdown = () => {
  console.log("Shutting down gracefully...");

  // Stop the cleanup service
  lobbyCleanupService.stopScheduledJob();

  // Close the server
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  // Force close after 10 seconds if not closed gracefully
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Handle graceful shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error);
  process.exit(1);
});

// Start the server
startServer();

export { app, server, io };
