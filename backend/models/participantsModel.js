import mongoose from "mongoose";

const participantSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eventModel",
      required: true,
    },
    phone: {
      type: String,
    },
    code: {
      type: String,
      required: true,
    },
    isPresent: {
      type: Boolean,
      default: false,
    },
    presentTime: {
      type: Date,
      default: null,
    },
    hasAccessedLobby: {
      type: Boolean,
      default: false,
    },
    firstLobbyAccess: {
      type: Date,
      default: null,
    },
    lastLobbyAccess: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only register once per event
participantSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const participantModel = mongoose.model("participantModel", participantSchema);

export { participantModel };
