// models/eventModel.js
import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      maxlength: [100, "Event name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Event image URL is required"],
      validate: {
        validator: function (value) {
          // Basic URL validation
          const urlPattern =
            /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
          return urlPattern.test(value);
        },
        message: "Please enter a valid URL for the image",
      },
    },
    category: {
      type: [String],
      required: [true, "At least one category is required"],
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one category is required",
      },
    },
    startDate: {
      type: Date,
      required: [true, "Event start date is required"],
      validate: {
        validator: function (value) {
          // Only validate on create, not on update
          if (this.isNew) {
            return value >= new Date();
          }
          return true;
        },
        message: "Start date cannot be in the past",
      },
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
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "participantModel",
      },
    ],
    participantCount: {
      type: Number,
      default: 0,
      min: [0, "Participant count cannot be negative"],
    },
    maxParticipants: {
      type: Number,
      default: null, // null means unlimited
      validate: {
        validator: function (value) {
          return value === null || value > 0;
        },
        message: "Maximum participants must be a positive number",
      },
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
      description:
        "If false, the event is private and only visible to specific users",
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "published",
    },
    tags: [String],
    contactEmail: {
      type: String,
      validate: {
        validator: function (value) {
          // Skip validation if empty
          if (!value) return true;

          // Basic email validation
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailPattern.test(value);
        },
        message: "Please provide a valid email address",
      },
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    additionalInfo: {
      type: Map,
      of: String,
      default: {},
    },
    views: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "userModel",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexes for better query performance
eventSchema.index({ name: "text", description: "text" }); // Text search
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ isPublic: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ price: 1 });

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

// Virtual for registration status
eventSchema.virtual("registrationStatus").get(function () {
  if (!this.isActive) return "closed";
  if (this.status === "cancelled") return "cancelled";

  const now = new Date();
  if (now > this.endDate) return "ended";

  if (this.maxParticipants && this.participantCount >= this.maxParticipants) {
    return "full";
  }

  return "open";
});

// Method to check if registration is open
eventSchema.methods.isRegistrationOpen = function () {
  return this.registrationStatus === "open";
};

// Method to check if event is full
eventSchema.methods.isFull = function () {
  if (!this.maxParticipants) return false;
  return this.participantCount >= this.maxParticipants;
};

// Static method to find nearby events (if you want to implement location-based search later)
eventSchema.statics.findNearby = async function (
  location,
  distance,
  options = {}
) {
  // This would be a placeholder for future geospatial search implementation
  // Would require adding geolocation fields to the schema
  return this.find({ location: new RegExp(location, "i") });
};

// Static method to find events by tag
eventSchema.statics.findByTag = async function (tag) {
  return this.find({ tags: tag });
};

// Static method to find featured events
eventSchema.statics.findFeatured = async function (limit = 5) {
  return this.find({
    isActive: true,
    isPublic: true,
    status: "published",
    startDate: { $gte: new Date() },
  })
    .sort({ participantCount: -1, views: -1 })
    .limit(limit);
};

// Pre-save middleware
eventSchema.pre("save", async function (next) {
  // Set the participant count based on the participants array length
  if (this.isModified("participants")) {
    this.participantCount = this.participants.length;
  }

  next();
});

// Helper function to update rating when adding a review
eventSchema.methods.updateRating = function () {
  if (!this.reviews || this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const totalRating = this.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
};

const eventModel = mongoose.model("eventModel", eventSchema);

export { eventModel };
