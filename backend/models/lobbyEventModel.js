import mongoose from "mongoose";

const lobbyEventSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Lobby name is required"],
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eventModel",
      required: [true, "Event ID is required"],
    },
    description: {
      type: String,
      required: false,
    },
    maxParticipants: {
      type: Number,
      required: false,
      default: 0, // 0 means unlimited
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: [true, "Creator is required"],
    },
    startTime: {
      type: Date,
      required: false,
    },
    endTime: {
      type: Date,
      required: false,
    },
    meetingUrl: {
      type: String,
      required: false,
    },
    lobbyType: {
      type: String,
      enum: ["general", "workshop", "networking", "presentation","dating", "other"],
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for counting participants
lobbyEventSchema.virtual("participantCount").get(function () {
  return this.participants.length;
});

// Virtual for checking if lobby is full
lobbyEventSchema.virtual("isFull").get(function () {
  if (this.maxParticipants === 0) return false; // Unlimited participants
  return this.participants.length >= this.maxParticipants;
});

// Middleware to prevent adding participants if lobby is full
lobbyEventSchema.pre("save", function (next) {
  if (this.isModified("participants") && this.maxParticipants > 0) {
    if (this.participants.length > this.maxParticipants) {
      const error = new Error("Cannot exceed maximum number of participants");
      return next(error);
    }
  }
  next();
});

// Method to check if user is already in lobby
lobbyEventSchema.methods.hasParticipant = function (userId) {
  return this.participants.some(
    (participantId) => participantId.toString() === userId.toString()
  );
};

// Method to add participant to lobby
lobbyEventSchema.methods.addParticipant = function (userId) {
  if (this.hasParticipant(userId)) {
    return false; // Already in lobby
  }

  if (this.isFull) {
    return false; // Lobby is full
  }

  this.participants.push(userId);
  return true;
};

// Method to remove participant from lobby
lobbyEventSchema.methods.removeParticipant = function (userId) {
  if (!this.hasParticipant(userId)) {
    return false; // Not in lobby
  }

  this.participants = this.participants.filter(
    (participantId) => participantId.toString() !== userId.toString()
  );
  return true;
};

const lobbyModel = mongoose.model("lobbyModel", lobbyEventSchema);

export { lobbyModel };
