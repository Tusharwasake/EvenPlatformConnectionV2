import mongoose from "mongoose";

const friendSchema = mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eventModel",
      required: true,
      // This field tracks which event brought these users together
    },
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lobbyModel",
      required: true,
      // This field tracks which specific lobby they connected in
    },
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes to prevent duplicates and enable efficient queries
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendSchema.index({ requester: 1, status: 1 });
friendSchema.index({ recipient: 1, status: 1 });
friendSchema.index({ eventId: 1 });

// Static method to check if a friend request exists between two users
friendSchema.statics.checkExistingConnection = async function (
  userId1,
  userId2
) {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  });
  return connection;
};

const friendModel = mongoose.model("friendModel", friendSchema);

export { friendModel };
