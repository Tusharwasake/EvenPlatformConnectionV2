import express from "express";
import {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markMessagesAsRead,
  deleteConversation,
  getUnreadCount,
} from "../controllers/chatController.js";
import { authentication } from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat routes require authentication
router.use(authentication);

// Get all conversations for the user
router.get("/conversations", getConversations);

// Get messages for a specific conversation
router.get("/conversations/:conversationId/messages", getMessages);

// Create a new conversation
router.post("/conversations", createConversation);

// Send a message (HTTP fallback, primary method is WebSocket)
router.post("/conversations/:conversationId/messages", sendMessage);

// Mark messages as read
router.put("/conversations/:conversationId/read", markMessagesAsRead);

// Delete a conversation (soft delete)
router.delete("/conversations/:conversationId", deleteConversation);

// Get unread message count
router.get("/unread", getUnreadCount);

export default router;
