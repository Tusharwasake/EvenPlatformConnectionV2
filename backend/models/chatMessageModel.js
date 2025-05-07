import mongoose from "mongoose";

const chatMessageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000, // Limit message length
    },
    friendshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "friendModel",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentType: {
      type: String,
      enum: [null, "image", "document", "audio"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for more efficient querying
chatMessageSchema.index({ sender: 1, recipient: 1 });
chatMessageSchema.index({ friendshipId: 1 });
chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ isRead: 1 });

const chatMessageModel = mongoose.model("chatMessageModel", chatMessageSchema);

export { chatMessageModel };
