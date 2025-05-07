import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Event image URL is required"],
    },
    category: {
      type: [String],
      required: [true, "At least one category is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Event start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Event end date is required"],
      validate: {
        validator: function (value) {
          return value >= this.startDate;
        },
        message: "End date must be after or equal to start date",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: [true, "Event creator is required"],
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ createdBy: 1 });

// Virtual for checking if event is upcoming
eventSchema.virtual("isUpcoming").get(function () {
  return new Date() < this.startDate;
});

// Virtual for checking if event is ongoing
eventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

// Virtual for checking if event is past
eventSchema.virtual("isPast").get(function () {
  return new Date() > this.endDate;
});

// Method to check if registration is open
eventSchema.methods.isRegistrationOpen = function () {
  return this.isActive && new Date() < this.endDate;
};

const eventModel = mongoose.model("eventModel", eventSchema);

export { eventModel };
