import { chatMessageModel } from "../models/chatMessageModel.js";
import { chatConversationModel } from "../models/chatConversationModel.js";
import { friendModel } from "../models/friendModel.js";

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all conversations where user is a participant
    const conversations = await chatConversationModel
      .find({
        participants: userId,
        isActive: true,
      })
      .populate("participants", "name email")
      .populate("lastMessage")
      .populate("friendshipId")
      .sort("-updatedAt");

    // Format conversations for better client-side use
    const formattedConversations = conversations.map((conversation) => {
      // Find the other participant (not the current user)
      const otherParticipant = conversation.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        id: conversation._id,
        friendshipId: conversation.friendshipId._id,
        friend: otherParticipant,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
        updatedAt: conversation.updatedAt,
        originalEventId: conversation.originalEventId,
        originalLobbyId: conversation.originalLobbyId,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversations",
      error: error.message,
    });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    // Find the conversation
    const conversation = await chatConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is a participant in this conversation
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Get messages with pagination
    const messages = await chatMessageModel
      .find({
        friendshipId: conversation.friendshipId,
      })
      .populate("sender", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark unread messages as read
    if (messages.length > 0) {
      await chatMessageModel.updateMany(
        {
          friendshipId: conversation.friendshipId,
          recipient: userId,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      // Update the unread count in the conversation
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    // Get total message count for pagination
    const totalMessages = await chatMessageModel.countDocuments({
      friendshipId: conversation.friendshipId,
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page,
        totalMessages,
      },
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

// Create a new conversation
export const createConversation = async (req, res) => {
  try {
    const { friendshipId } = req.body;
    const userId = req.user.userId;

    // Check if friendship exists and is accepted
    const friendship = await friendModel.findOne({
      _id: friendshipId,
      status: "accepted",
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friendship not found or not accepted",
      });
    }

    // Determine the other user in the friendship
    let otherUserId;
    if (friendship.requester.toString() === userId) {
      otherUserId = friendship.recipient;
    } else if (friendship.recipient.toString() === userId) {
      otherUserId = friendship.requester;
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not part of this friendship",
      });
    }

    // Check if conversation already exists
    const existingConversation = await chatConversationModel.findOne({
      friendshipId,
    });

    if (existingConversation) {
      // If inactive, reactivate it
      if (!existingConversation.isActive) {
        existingConversation.isActive = true;
        await existingConversation.save();
      }

      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: existingConversation,
      });
    }

    // Create a new conversation
    const newConversation = new chatConversationModel({
      participants: [userId, otherUserId],
      friendshipId: friendship._id,
      originalEventId: friendship.eventId,
      originalLobbyId: friendship.lobbyId,
    });

    await newConversation.save();

    // Populate the new conversation
    const populatedConversation = await chatConversationModel
      .findById(newConversation._id)
      .populate("participants", "name email");

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: populatedConversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

// Send a message (HTTP fallback, primary method is WebSocket)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, attachmentUrl, attachmentType } = req.body;
    const userId = req.user.userId;

    // Validate content
    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
      });
    }

    // Find the conversation
    const conversation = await chatConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Get the recipient (other participant)
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== userId
    );

    // Create the message
    const newMessage = new chatMessageModel({
      sender: userId,
      recipient: recipientId,
      content,
      friendshipId: conversation.friendshipId,
      attachmentUrl,
      attachmentType,
    });

    await newMessage.save();

    // Update the conversation with the last message
    conversation.lastMessage = newMessage._id;

    // Increment unread count for recipient
    const recipientUnreadCount =
      conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(
      recipientId.toString(),
      recipientUnreadCount + 1
    );

    await conversation.save();

    // Populate the message before sending the response
    const populatedMessage = await chatMessageModel
      .findById(newMessage._id)
      .populate("sender", "name email");

    // In a real implementation, we would emit this message via WebSocket
    // For now, we'll just return it in the HTTP response
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Find the conversation
    const conversation = await chatConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Mark all unread messages as read
    const result = await chatMessageModel.updateMany(
      {
        friendshipId: conversation.friendshipId,
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Update the conversation unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      data: {
        markedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

// Delete a conversation (soft delete)
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Find the conversation
    const conversation = await chatConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Soft delete by marking as inactive
    conversation.isActive = false;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
      error: error.message,
    });
  }
};

// Get unread message count across all conversations
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all active conversations for the user
    const conversations = await chatConversationModel.find({
      participants: userId,
      isActive: true,
    });

    // Calculate total unread count
    let totalUnread = 0;
    for (const conversation of conversations) {
      totalUnread += conversation.unreadCount.get(userId.toString()) || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        unreadCount: totalUnread,
      },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};
