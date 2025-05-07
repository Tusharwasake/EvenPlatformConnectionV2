import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { chatMessageModel } from "./models/chatMessageModel.js";
import { chatConversationModel } from "./models/chatConversationModel.js";
import { friendModel } from "./models/friendModel.js";

// Setup WebSocket server with Socket.io
const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*", // Adjust according to your frontend URL
      methods: ["GET", "POST"],
    },
  });

  // Store online users
  const onlineUsers = new Map(); // userId -> socketId

  // Authentication middleware for WebSocket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (!decoded || !decoded.userId) {
        return next(new Error("Invalid token"));
      }

      // Store user information in socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Handle WebSocket connections
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to online users map
    onlineUsers.set(socket.userId, socket.id);

    // Notify user's friends that they are online
    notifyFriendsOfOnlineStatus(socket.userId, true);

    // Join user-specific room for private messages
    socket.join(`user:${socket.userId}`);

    // Handle joining a conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
    });

    // Handle sending messages
    socket.on("send-message", async (messageData, callback) => {
      try {
        const { conversationId, content, attachmentUrl, attachmentType } =
          messageData;

        // Validate required fields
        if (!conversationId || !content || content.trim() === "") {
          return callback({
            success: false,
            message: "Invalid message data",
          });
        }

        // Find the conversation
        const conversation =
          await chatConversationModel.findById(conversationId);
        if (!conversation) {
          return callback({
            success: false,
            message: "Conversation not found",
          });
        }

        // Check if user is a participant
        if (!conversation.participants.includes(socket.userId)) {
          return callback({
            success: false,
            message: "You are not a participant in this conversation",
          });
        }

        // Check if friendship is still valid (not blocked or deleted)
        const friendship = await friendModel.findById(
          conversation.friendshipId
        );
        if (!friendship || friendship.status !== "accepted") {
          return callback({
            success: false,
            message: "This friendship is no longer active",
          });
        }

        // Get the recipient (other participant)
        const recipientId = conversation.participants.find(
          (p) => p.toString() !== socket.userId
        );

        // Create a new message
        const newMessage = new chatMessageModel({
          sender: socket.userId,
          recipient: recipientId,
          content,
          friendshipId: conversation.friendshipId,
          attachmentUrl,
          attachmentType,
        });

        await newMessage.save();

        // Update the conversation with last message
        conversation.lastMessage = newMessage._id;

        // Increment unread count for recipient
        const recipientUnreadCount =
          conversation.unreadCount.get(recipientId.toString()) || 0;
        conversation.unreadCount.set(
          recipientId.toString(),
          recipientUnreadCount + 1
        );

        await conversation.save();

        // Populate message with sender info
        const populatedMessage = await chatMessageModel
          .findById(newMessage._id)
          .populate("sender", "name email");

        // Emit the message to the conversation room
        io.to(`conversation:${conversationId}`).emit("new-message", {
          message: populatedMessage,
          conversationId,
        });

        // If recipient is not in the conversation room, send notification
        if (
          !io.sockets.adapter.rooms
            .get(`conversation:${conversationId}`)
            ?.has(onlineUsers.get(recipientId))
        ) {
          io.to(`user:${recipientId}`).emit("message-notification", {
            conversationId,
            message: populatedMessage,
          });
        }

        // Send success callback
        callback({
          success: true,
          data: populatedMessage,
        });
      } catch (error) {
        console.error("Error sending message via WebSocket:", error);
        callback({
          success: false,
          message: "Failed to send message",
        });
      }
    });

    // Handle marking messages as read
    socket.on("mark-as-read", async ({ conversationId }, callback) => {
      try {
        // Find the conversation
        const conversation =
          await chatConversationModel.findById(conversationId);
        if (!conversation) {
          return callback({
            success: false,
            message: "Conversation not found",
          });
        }

        // Check if user is a participant
        if (!conversation.participants.includes(socket.userId)) {
          return callback({
            success: false,
            message: "You are not a participant in this conversation",
          });
        }

        // Mark all unread messages as read
        await chatMessageModel.updateMany(
          {
            friendshipId: conversation.friendshipId,
            recipient: socket.userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // Update unread count in conversation
        conversation.unreadCount.set(socket.userId.toString(), 0);
        await conversation.save();

        // Notify sender that messages were read
        const otherParticipant = conversation.participants.find(
          (p) => p.toString() !== socket.userId
        );

        io.to(`user:${otherParticipant}`).emit("messages-read", {
          conversationId,
          readBy: socket.userId,
        });

        callback({
          success: true,
          message: "Messages marked as read",
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        callback({
          success: false,
          message: "Failed to mark messages as read",
        });
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("typing-indicator", {
        userId: socket.userId,
        conversationId,
        isTyping,
      });
    });

    // Handle getting online status
    socket.on("get-online-status", async ({ userIds }, callback) => {
      try {
        const onlineStatus = {};

        for (const userId of userIds) {
          onlineStatus[userId] = onlineUsers.has(userId);
        }

        callback({
          success: true,
          data: onlineStatus,
        });
      } catch (error) {
        console.error("Error getting online status:", error);
        callback({
          success: false,
          message: "Failed to get online status",
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove from online users
      onlineUsers.delete(socket.userId);

      // Notify friends that user is offline
      notifyFriendsOfOnlineStatus(socket.userId, false);
    });
  });

  // Helper function to notify friends when a user comes online or goes offline
  const notifyFriendsOfOnlineStatus = async (userId, isOnline) => {
    try {
      // Find all accepted friendships
      const friendships = await friendModel.find({
        $or: [
          { requester: userId, status: "accepted" },
          { recipient: userId, status: "accepted" },
        ],
      });

      // For each friendship, notify the other user
      for (const friendship of friendships) {
        const friendId =
          friendship.requester.toString() === userId
            ? friendship.recipient.toString()
            : friendship.requester.toString();

        // Check if friend is online
        if (onlineUsers.has(friendId)) {
          io.to(`user:${friendId}`).emit("friend-status-change", {
            userId,
            isOnline,
          });
        }
      }
    } catch (error) {
      console.error("Error notifying friends of online status:", error);
    }
  };

  return io;
};

export default setupWebSocket;
