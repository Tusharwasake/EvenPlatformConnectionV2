import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  blockUser,
  unblockUser,
  getFriendRequests,
  getFriends,
  getBlockedUsers,
  getPotentialFriends,
  removeFriend,
  checkFriendshipStatus,
} from "../controllers/friendController.js";
import { authentication } from "../middleware/authMiddleware.js";

const friendRoutes = express.Router();

// All friend routes require authentication
friendRoutes.use(authentication);

// Send a friend request
friendRoutes.post("/request", sendFriendRequest);

// Accept a friend request
friendRoutes.put("/accept/:requestId", acceptFriendRequest);

// Reject a friend request
friendRoutes.put("/reject/:requestId", rejectFriendRequest);

// Block a user
friendRoutes.post("/block/:userId", blockUser);

// Unblock a user
friendRoutes.delete("/unblock/:userId", unblockUser);

// Get all friend requests (sent and received)
friendRoutes.get("/requests", getFriendRequests);

// Get all friends
friendRoutes.get("/", getFriends);

// Get all blocked users
friendRoutes.get("/blocked", getBlockedUsers);

// Get potential friends in a lobby
friendRoutes.get("/potential/:lobbyId", getPotentialFriends);

// Remove a friend
friendRoutes.delete("/:friendshipId", removeFriend);

// Check friendship status with another user
friendRoutes.get("/status/:otherUserId", checkFriendshipStatus);

export default friendRoutes;
