import { friendModel } from "../models/friendModel.js";
import { participantModel } from "../models/participantsModel.js";
import { lobbyModel } from "../models/lobbyEventModel.js";

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId, lobbyId } = req.body;
    const requesterId = req.user.userId;

    // Prevent sending friend request to self
    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    // Find the lobby
    const lobby = await lobbyModel.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Check if both users are in the same lobby
    const requesterInLobby = lobby.participants.includes(requesterId);
    const recipientInLobby = lobby.participants.includes(recipientId);

    if (!requesterInLobby || !recipientInLobby) {
      return res.status(403).json({
        success: false,
        message:
          "Both users must be in the same lobby to send a friend request",
      });
    }

    // Check if both users are verified participants of the event
    const requesterParticipant = await participantModel.findOne({
      userId: requesterId,
      eventId: lobby.eventId,
      isPresent: true,
    });

    const recipientParticipant = await participantModel.findOne({
      userId: recipientId,
      eventId: lobby.eventId,
      isPresent: true,
    });

    if (!requesterParticipant || !recipientParticipant) {
      return res.status(403).json({
        success: false,
        message: "Both users must be verified participants of the event",
      });
    }

    // Check if a connection already exists
    const existingConnection = await friendModel.checkExistingConnection(
      requesterId,
      recipientId
    );

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: "A connection already exists between these users",
        data: existingConnection,
      });
    }

    // Create a new friend request
    const newFriendRequest = new friendModel({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
      eventId: lobby.eventId,
      lobbyId: lobbyId,
    });

    await newFriendRequest.save();

    res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      data: newFriendRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send friend request",
      error: error.message,
    });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    // Find the friend request
    const friendRequest = await friendModel.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Check if the user is the recipient of the request
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only accept friend requests sent to you",
      });
    }

    // Check if the request is still pending
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This friend request is already ${friendRequest.status}`,
      });
    }

    // Update the request status
    friendRequest.status = "accepted";
    friendRequest.lastInteraction = new Date();
    await friendRequest.save();

    // Return the updated request with populated user data
    const populatedRequest = await friendModel
      .findById(requestId)
      .populate("requester", "name email")
      .populate("recipient", "name email");

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
      data: populatedRequest,
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept friend request",
      error: error.message,
    });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    // Find the friend request
    const friendRequest = await friendModel.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Check if the user is the recipient of the request
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only reject friend requests sent to you",
      });
    }

    // Check if the request is still pending
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This friend request is already ${friendRequest.status}`,
      });
    }

    // Update the request status
    friendRequest.status = "rejected";
    friendRequest.lastInteraction = new Date();
    await friendRequest.save();

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
      data: friendRequest,
    });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject friend request",
      error: error.message,
    });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userId: userToBlock } = req.params;
    const userId = req.user.userId;

    // Prevent blocking yourself
    if (userId === userToBlock) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself",
      });
    }

    // Check if a connection already exists
    const existingConnection = await friendModel.checkExistingConnection(
      userId,
      userToBlock
    );

    if (existingConnection) {
      // Update existing connection
      existingConnection.status = "blocked";
      existingConnection.lastInteraction = new Date();
      await existingConnection.save();

      return res.status(200).json({
        success: true,
        message: "User has been blocked",
        data: existingConnection,
      });
    }

    // Find one event and lobby both users are in (if any)
    const userParticipations = await participantModel.find({ userId });
    const userEventIds = userParticipations.map((p) => p.eventId);

    const otherUserInSameEvent = await participantModel.findOne({
      userId: userToBlock,
      eventId: { $in: userEventIds },
    });

    if (!otherUserInSameEvent) {
      return res.status(400).json({
        success: false,
        message: "You can only block users you've encountered in an event",
      });
    }

    // Get a lobby both users are in
    const sharedLobby = await lobbyModel.findOne({
      eventId: otherUserInSameEvent.eventId,
      participants: { $all: [userId, userToBlock] },
    });

    if (!sharedLobby) {
      return res.status(400).json({
        success: false,
        message: "You can only block users you've shared a lobby with",
      });
    }

    // Create a new blocked relationship
    const blockRelationship = new friendModel({
      requester: userId,
      recipient: userToBlock,
      status: "blocked",
      eventId: otherUserInSameEvent.eventId,
      lobbyId: sharedLobby._id,
    });

    await blockRelationship.save();

    res.status(201).json({
      success: true,
      message: "User has been blocked",
      data: blockRelationship,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block user",
      error: error.message,
    });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId: userToUnblock } = req.params;
    const userId = req.user.userId;

    // Find the block relationship
    const blockRelationship = await friendModel.findOne({
      requester: userId,
      recipient: userToUnblock,
      status: "blocked",
    });

    if (!blockRelationship) {
      return res.status(404).json({
        success: false,
        message: "No block relationship found with this user",
      });
    }

    // Delete the block relationship
    await friendModel.findByIdAndDelete(blockRelationship._id);

    res.status(200).json({
      success: true,
      message: "User has been unblocked",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unblock user",
      error: error.message,
    });
  }
};

// Get all friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all pending requests received by the user
    const pendingRequests = await friendModel
      .find({
        recipient: userId,
        status: "pending",
      })
      .populate("requester", "name email")
      .sort("-createdAt");

    // Get all pending requests sent by the user
    const sentRequests = await friendModel
      .find({
        requester: userId,
        status: "pending",
      })
      .populate("recipient", "name email")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      data: {
        received: pendingRequests,
        sent: sentRequests,
      },
    });
  } catch (error) {
    console.error("Error getting friend requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get friend requests",
      error: error.message,
    });
  }
};

// Get all friends
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all accepted connections where user is the requester
    const friendsAsRequester = await friendModel
      .find({
        requester: userId,
        status: "accepted",
      })
      .populate("recipient", "name email")
      .sort("-lastInteraction");

    // Get all accepted connections where user is the recipient
    const friendsAsRecipient = await friendModel
      .find({
        recipient: userId,
        status: "accepted",
      })
      .populate("requester", "name email")
      .sort("-lastInteraction");

    // Combine and format the friends list
    const friends = [
      ...friendsAsRequester.map((fr) => ({
        friendshipId: fr._id,
        friend: fr.recipient,
        eventId: fr.eventId,
        lobbyId: fr.lobbyId,
        since: fr.updatedAt,
      })),
      ...friendsAsRecipient.map((fr) => ({
        friendshipId: fr._id,
        friend: fr.requester,
        eventId: fr.eventId,
        lobbyId: fr.lobbyId,
        since: fr.updatedAt,
      })),
    ];

    // Sort by most recent interaction
    friends.sort((a, b) => new Date(b.since) - new Date(a.since));

    res.status(200).json({
      success: true,
      count: friends.length,
      data: friends,
    });
  } catch (error) {
    console.error("Error getting friends list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get friends list",
      error: error.message,
    });
  }
};

// Get all blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all blocked connections
    const blockedUsers = await friendModel
      .find({
        requester: userId,
        status: "blocked",
      })
      .populate("recipient", "name email")
      .sort("-lastInteraction");

    res.status(200).json({
      success: true,
      count: blockedUsers.length,
      data: blockedUsers,
    });
  } catch (error) {
    console.error("Error getting blocked users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blocked users",
      error: error.message,
    });
  }
};

// Get potential friends (users in same lobby)
export const getPotentialFriends = async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user.userId;

    // Find the lobby
    const lobby = await lobbyModel
      .findById(lobbyId)
      .populate("participants", "name email");

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: "Lobby not found",
      });
    }

    // Check if user is in this lobby
    if (!lobby.participants.some((p) => p._id.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: "You must be in this lobby to see potential friends",
      });
    }

    // Get existing connections (both ways)
    const existingConnections = await friendModel.find({
      $or: [{ requester: userId }, { recipient: userId }],
    });

    // Extract user IDs with existing connections
    const connectedUserIds = new Set();
    existingConnections.forEach((conn) => {
      if (conn.requester.toString() === userId) {
        connectedUserIds.add(conn.recipient.toString());
      } else {
        connectedUserIds.add(conn.requester.toString());
      }
    });

    // Filter out users who already have a connection and the current user
    const potentialFriends = lobby.participants.filter((participant) => {
      const participantId = participant._id.toString();
      return participantId !== userId && !connectedUserIds.has(participantId);
    });

    res.status(200).json({
      success: true,
      count: potentialFriends.length,
      data: potentialFriends,
    });
  } catch (error) {
    console.error("Error getting potential friends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get potential friends",
      error: error.message,
    });
  }
};

// Remove a friend
export const removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.userId;

    // Find the friendship
    const friendship = await friendModel.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friendship not found",
      });
    }

    // Check if user is part of this friendship
    if (
      friendship.requester.toString() !== userId &&
      friendship.recipient.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this friendship",
      });
    }

    // Check if this is an actual friendship (accepted status)
    if (friendship.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "This is not an active friendship",
      });
    }

    // Delete the friendship
    await friendModel.findByIdAndDelete(friendshipId);

    res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove friend",
      error: error.message,
    });
  }
};

// Check friendship status with another user
export const checkFriendshipStatus = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot check friendship status with yourself",
      });
    }

    // Check if a connection exists
    const connection = await friendModel.checkExistingConnection(
      userId,
      otherUserId
    );

    if (!connection) {
      return res.status(200).json({
        success: true,
        status: "none",
        message: "No connection exists between these users",
      });
    }

    // Determine the status and direction
    let statusInfo = {
      status: connection.status,
      connectionId: connection._id,
    };

    if (connection.status === "pending") {
      if (connection.requester.toString() === userId) {
        statusInfo.direction = "outgoing";
        statusInfo.message = "You sent a friend request to this user";
      } else {
        statusInfo.direction = "incoming";
        statusInfo.message = "This user sent you a friend request";
      }
    } else if (connection.status === "accepted") {
      statusInfo.message = "You are friends with this user";
    } else if (connection.status === "rejected") {
      if (connection.requester.toString() === userId) {
        statusInfo.message = "Your friend request was rejected";
      } else {
        statusInfo.message = "You rejected this user's friend request";
      }
    } else if (connection.status === "blocked") {
      if (connection.requester.toString() === userId) {
        statusInfo.message = "You have blocked this user";
      } else {
        statusInfo.message = "You have been blocked by this user";
      }
    }

    res.status(200).json({
      success: true,
      data: statusInfo,
    });
  } catch (error) {
    console.error("Error checking friendship status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check friendship status",
      error: error.message,
    });
  }
};
