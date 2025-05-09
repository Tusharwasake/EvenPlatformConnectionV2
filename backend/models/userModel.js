import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["participant", "organizer","admin"],
      default: "participant",
    },
    lobbyStatus: { type: Boolean, default: false },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "userModel" }],
    friendRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "friendRequestModel" },
    ],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamp: true,
  }
);

const userModel = mongoose.model("userModel", userSchema);

export { userModel };
