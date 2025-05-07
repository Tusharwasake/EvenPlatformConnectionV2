import mongoose from "mongoose";

const chatConversationSchema = mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
        required: true,
      },
    ],
    friendshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "friendModel",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chatMessageModel",
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    originalEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eventModel",
      required: true,
    },
    originalLobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lobbyModel",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
chatConversationSchema.index({ participants: 1 });
chatConversationSchema.index({ friendshipId: 1 }, { unique: true });
chatConversationSchema.index({ isActive: 1 });
chatConversationSchema.index({ updatedAt: -1 });

const chatConversationModel = mongoose.model(
  "chatConversationModel",
  chatConversationSchema
);

export { chatConversationModel };
