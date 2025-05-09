// import { eventModel } from "../models/eventModel.js";

// // Create a new event
// export const createEvent = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       location,
//       imageUrl,
//       startDate,
//       endDate,
//       category,
//     } = req.body;
//     const eventCategory = category && category.length > 0 ? category : [];

//     const createdBy = req.user.userId;

//     // Validate required fields
//     if (
//       !name ||
//       !description ||
//       !location ||
//       !imageUrl ||
//       !startDate ||
//       !endDate ||
//       !eventCategory ||
//       !createdBy
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const payload = {
//       name,
//       description,
//       location,
//       imageUrl,
//       category: eventCategory,
//       startDate,
//       endDate,
//       createdBy,
//       participantCount: 0, // Initialize participant count
//     };

//     const createdEvent = await eventModel.create(payload);

//     res.status(201).json({
//       success: true,
//       message: "Event created successfully",
//       data: createdEvent,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get all events
// export const getAllEvents = async (req, res) => {
//   try {
//     const allEvents = await eventModel
//       .find({})
//       .populate("createdBy", "name email")
//       .sort({ startDate: 1 }); // Sort by upcoming events

//     res.status(200).json({
//       success: true,
//       message: "Events retrieved successfully",
//       count: allEvents.length,
//       data: allEvents,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get event by ID
// export const getEventById = async (req, res) => {
//   try {
//     const event = await eventModel
//       .findById(req.params.id)
//       .populate("createdBy", "name email");

//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Event retrieved successfully",
//       data: event,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Update event
// export const updateEvent = async (req, res) => {
//   try {
//     const eventId = req.params.id;
//     const updateData = req.body;

//     // Find event first to verify ownership if needed
//     const event = await eventModel.findById(eventId);

//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found",
//       });
//     }

//     // Check if user is the creator of the event (optional authorization check)
//     if (
//       req.user.role !== "organizer" &&
//       event.createdBy.toString() !== req.user.userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You don't have permission to update this event",
//       });
//     }

//     const updatedEvent = await eventModel.findByIdAndUpdate(
//       eventId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Event updated successfully",
//       data: updatedEvent,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// // Delete event
// export const deleteEvent = async (req, res) => {
//   try {
//     const eventId = req.params.id;

//     // Find event first to verify ownership if needed
//     const event = await eventModel.findById(eventId);

//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: "Event not found",
//       });
//     }

//     // Check if user is the creator of the event (optional authorization check)
//     if (
//       req.user.role !== "organizer" &&
//       event.createdBy.toString() !== req.user.userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You don't have permission to delete this event",
//       });
//     }

//     const deletedEvent = await eventModel.findByIdAndDelete(eventId);

//     res.status(200).json({
//       success: true,
//       message: "Event deleted successfully",
//       data: deletedEvent,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// // Get events by category
// export const getEventsByCategory = async (req, res) => {
//   try {
//     const { category } = req.params;

//     const events = await eventModel
//       .find({ category: { $in: [category] } })
//       .populate("createdBy", "name email")
//       .sort({ startDate: 1 });

//     res.status(200).json({
//       success: true,
//       message: `Events in category '${category}' retrieved successfully`,
//       count: events.length,
//       data: events,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get events created by a specific user
// export const getEventsByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const events = await eventModel
//       .find({ createdBy: userId })
//       .sort({ startDate: 1 });

//     res.status(200).json({
//       success: true,
//       message: "User's events retrieved successfully",
//       count: events.length,
//       data: events,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get upcoming events (events with start date in the future)
// export const getUpcomingEvents = async (req, res) => {
//   try {
//     const currentDate = new Date();

//     const upcomingEvents = await eventModel
//       .find({
//         startDate: { $gte: currentDate },
//       })
//       .populate("createdBy", "name email")
//       .sort({ startDate: 1 });

//     res.status(200).json({
//       success: true,
//       message: "Upcoming events retrieved successfully",
//       count: upcomingEvents.length,
//       data: upcomingEvents,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Get past events (events with end date in the past)
// export const getPastEvents = async (req, res) => {
//   try {
//     const currentDate = new Date();

//     const pastEvents = await eventModel
//       .find({
//         endDate: { $lt: currentDate },
//       })
//       .populate("createdBy", "name email")
//       .sort({ endDate: -1 });

//     res.status(200).json({
//       success: true,
//       message: "Past events retrieved successfully",
//       count: pastEvents.length,
//       data: pastEvents,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// controllers/eventControllers.js
import { eventModel } from "../models/eventModel.js";
import mongoose from "mongoose";

/**
 * Create a new event
 * @route POST /events
 * @access Private
 */
export const createEvent = async (req, res) => {
  try {
    // Extract event data from request body
    const {
      name,
      description,
      location,
      imageUrl,
      startDate,
      endDate,
      category,
      price,
      maxParticipants,
      tags,
      contactEmail,
      contactPhone,
      isPublic,
      additionalInfo,
    } = req.body;

    // Set the current user as the event creator
    const createdBy = req.user._id;

    // Create new event
    const newEvent = await eventModel.create({
      name,
      description,
      location,
      imageUrl,
      startDate,
      endDate,
      category,
      createdBy,
      price: price || 0,
      maxParticipants: maxParticipants || null,
      tags: tags || [],
      contactEmail: contactEmail || "",
      contactPhone: contactPhone || "",
      isPublic: typeof isPublic === "boolean" ? isPublic : true,
      additionalInfo: additionalInfo || {},
    });

    // Return success response with created event data
    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent,
    });
  } catch (error) {
    console.error("Error in createEvent:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
};

/**
 * Get all events with pagination and filtering
 * @route GET /events
 * @access Public
 */
// export const getAllEvents = async (req, res) => {
//   try {
//     // Extract query parameters with defaults
//     const {
//       page = 1,
//       limit = 10,
//       sort = "-createdAt",
//       status = "published",
//       isActive = true,
//       category,
//       startDate,
//       endDate,
//       minPrice,
//       maxPrice,
//       search,
//     } = req.query;

//     // Build filter object
//     const filter = {
//       status,
//       isActive,
//       isPublic: true, // Only show public events by default
//     };

//     // Add optional filters if provided
//     if (category) {
//       filter.category = {
//         $in: Array.isArray(category) ? category : [category],
//       };
//     }

//     if (startDate) filter.startDate = { $gte: new Date(startDate) };
//     if (endDate) filter.endDate = { $lte: new Date(endDate) };

//     // Price range filter
//     if (minPrice !== undefined || maxPrice !== undefined) {
//       filter.price = {};
//       if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
//       if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
//     }

//     // Text search
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//         { location: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Execute query with pagination
//     const events = await eventModel
//       .find(filter)
//       .sort(sort)
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate("createdBy", "name email"); // Populate creator info

//     // Get total count for pagination
//     const totalEvents = await eventModel.countDocuments(filter);

//     // Format the response to match expected output
//     res.status(200).json({
//       success: true,
//       message: "Events retrieved successfully",
//       count: events.length,
//       data: events,
//     });
//   } catch (error) {
//     console.error("Error in getAllEvents:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch events",
//       error: error.message,
//     });
//   }
// };

/**
 * Get all events - ultra simplified version
 * @route GET /events
 * @access Public
 */
export const getAllEvents = async (req, res) => {
  try {
    // Log the model we're using
    console.log("Using model:", eventModel.modelName);
    console.log("Collection name:", eventModel.collection.name);

    // Count documents with no filter
    const totalCount = await eventModel.countDocuments({});
    console.log("Total documents in collection:", totalCount);

    // Get all documents with no filters, no pagination
    const events = await eventModel.find({});
    console.log("Retrieved events count:", events.length);

    res.status(200).json({
      success: true,
      message: "Events retrieved with no filters",
      count: events.length,
      modelInfo: {
        modelName: eventModel.modelName,
        collectionName: eventModel.collection.name,
      },
      data: events,
    });
  } catch (error) {
    console.error("Error in getAllEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Get a single event by ID
 * @route GET /events/:id
 * @access Public
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Find event by ID and increment view count
    const event = await eventModel
      .findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true } // Return updated document
      )
      .populate("createdBy", "name email");

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event is public or user has access
    if (
      !event.isPublic &&
      (!req.user || !req.user._id.equals(event.createdBy._id))
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this event",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event retrieved successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error in getEventById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

/**
 * Update an event
 * @route PUT /events/:id
 * @access Private
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Find the event first to check ownership
    const event = await eventModel.findById(id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the event creator or an admin
    if (!event.createdBy.equals(userId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this event",
      });
    }

    // Prevent updating certain fields
    const restrictedFields = [
      "createdBy",
      "participants",
      "participantCount",
      "views",
      "rating",
      "reviews",
    ];
    restrictedFields.forEach((field) => {
      delete updates[field];
    });

    // Update the event
    const updatedEvent = await eventModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error in updateEvent:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

/**
 * Delete an event
 * @route DELETE /events/:id
 * @access Private
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Find the event first to check ownership
    const event = await eventModel.findById(id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the event creator or an admin
    if (!event.createdBy.equals(userId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this event",
      });
    }

    // Delete the event
    await eventModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error in deleteEvent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

/**
 * Get events by category
 * @route GET /events/category/:category
 * @access Public
 */
export const getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find events in the specified category
    const events = await eventModel
      .find({
        category: { $in: [category] },
        status: "published",
        isActive: true,
        isPublic: true,
      })
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    // Get total count for pagination
    const totalEvents = await eventModel.countDocuments({
      category: { $in: [category] },
      status: "published",
      isActive: true,
      isPublic: true,
    });

    res.status(200).json({
      success: true,
      message: `Events in category '${category}' retrieved successfully`,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getEventsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events by category",
      error: error.message,
    });
  }
};

/**
 * Get events created by a specific user
 * @route GET /events/user/:userId
 * @access Private
 */
export const getEventsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, includePrivate = false } = req.query;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Build filter object
    const filter = {
      createdBy: userId,
      status: { $ne: "draft" }, // Exclude drafts by default
    };

    // Check permissions for private events
    const isRequestingOwnEvents =
      req.user && req.user._id.toString() === userId;
    const isAdmin = req.user && req.user.role === "admin";

    // Only include private events if requested by the owner or an admin
    if (!isRequestingOwnEvents && !isAdmin) {
      filter.isPublic = true;
    } else if (includePrivate === "false") {
      filter.isPublic = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find events created by the user
    const events = await eventModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalEvents = await eventModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "User's events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getEventsByUser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user events",
      error: error.message,
    });
  }
};

/**
 * Get upcoming events
 * @route GET /events/upcoming
 * @access Public
 */
export const getUpcomingEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, days = 30 } = req.query;

    // Calculate date range
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find upcoming events
    const events = await eventModel
      .find({
        startDate: { $gte: now, $lte: futureDate },
        status: "published",
        isActive: true,
        isPublic: true,
      })
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    // Get total count for pagination
    const totalEvents = await eventModel.countDocuments({
      startDate: { $gte: now, $lte: futureDate },
      status: "published",
      isActive: true,
      isPublic: true,
    });

    res.status(200).json({
      success: true,
      message: "Upcoming events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getUpcomingEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events",
      error: error.message,
    });
  }
};

/**
 * Get past events
 * @route GET /events/past
 * @access Public
 */
export const getPastEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Current date
    const now = new Date();

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find past events
    const events = await eventModel
      .find({
        endDate: { $lt: now },
        status: "published",
        isPublic: true,
      })
      .sort({ endDate: -1 }) // Most recent past events first
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    // Get total count for pagination
    const totalEvents = await eventModel.countDocuments({
      endDate: { $lt: now },
      status: "published",
      isPublic: true,
    });

    res.status(200).json({
      success: true,
      message: "Past events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getPastEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch past events",
      error: error.message,
    });
  }
};

/**
 * Get featured events
 * @route GET /events/featured
 * @access Public
 */
export const getFeaturedEvents = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Use the model's static method to get featured events
    const events = await eventModel.findFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Featured events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getFeaturedEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured events",
      error: error.message,
    });
  }
};

/**
 * Search events
 * @route GET /events/search
 * @access Public
 */
export const searchEvents = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Perform search with text index
    const events = await eventModel
      .find(
        {
          $text: { $search: q },
          status: "published",
          isActive: true,
          isPublic: true,
        },
        {
          score: { $meta: "textScore" },
        }
      )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    // Get total count for pagination
    const totalEvents = await eventModel.countDocuments({
      $text: { $search: q },
      status: "published",
      isActive: true,
      isPublic: true,
    });

    res.status(200).json({
      success: true,
      message: "Search results retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in searchEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search events",
      error: error.message,
    });
  }
};

/**
 * Add a review to an event
 * @route POST /events/:id/reviews
 * @access Private
 */
export const addEventReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating is required and must be between 1 and 5",
      });
    }

    // Find the event
    const event = await eventModel.findById(id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event is completed (only allow reviews for past events)
    const now = new Date();
    if (now < event.endDate) {
      return res.status(400).json({
        success: false,
        message: "You can only review events that have ended",
      });
    }

    // Check if user has already reviewed this event
    const existingReviewIndex = event.reviews.findIndex(
      (review) => review.userId.toString() === userId.toString()
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      event.reviews[existingReviewIndex].rating = rating;
      event.reviews[existingReviewIndex].comment = comment || "";
      event.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      // Add new review
      event.reviews.push({
        userId,
        rating,
        comment: comment || "",
        createdAt: new Date(),
      });
    }

    // Update event rating
    event.updateRating();

    // Save the updated event
    await event.save();

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      data: event.reviews[
        existingReviewIndex !== -1
          ? existingReviewIndex
          : event.reviews.length - 1
      ],
    });
  } catch (error) {
    console.error("Error in addEventReview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    });
  }
};

/**
 * Get reviews for an event
 * @route GET /events/:id/reviews
 * @access Public
 */
export const getEventReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Find the event
    const event = await eventModel.findById(id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Paginate reviews
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = event.reviews.slice(startIndex, endIndex);

    // Populate user details for the reviews
    const populatedReviews = await Promise.all(
      paginatedReviews.map(async (review) => {
        // Get basic user info (you'll need a User model for this)
        // const user = await User.findById(review.userId, 'name profileImage');

        // For now, just return the review without populating user details
        return {
          ...review.toObject(),
          // user: user || { name: 'Anonymous' }
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Event reviews retrieved successfully",
      count: populatedReviews.length,
      averageRating: event.rating.average,
      data: populatedReviews,
    });
  } catch (error) {
    console.error("Error in getEventReviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

/**
 * Cancel an event
 * @route PATCH /events/:id/cancel
 * @access Private
 */
export const cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate if provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }

    // Find the event
    const event = await eventModel.findById(id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the event creator or an admin
    if (!event.createdBy.equals(userId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this event",
      });
    }

    // Check if event is already cancelled
    if (event.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Event is already cancelled",
      });
    }

    // Cancel the event
    event.status = "cancelled";
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error in cancelEvent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel event",
      error: error.message,
    });
  }
};

/**
 * Get organizer statistics
 * @route GET /events/organizer/stats
 * @access Private
 */
export const getOrganizerStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get basic counts
    const totalEvents = await eventModel.countDocuments({ createdBy: userId });
    const activeEvents = await eventModel.countDocuments({
      createdBy: userId,
      isActive: true,
      status: "published",
      endDate: { $gte: new Date() },
    });
    const pastEvents = await eventModel.countDocuments({
      createdBy: userId,
      endDate: { $lt: new Date() },
    });
    const cancelledEvents = await eventModel.countDocuments({
      createdBy: userId,
      status: "cancelled",
    });

    // Get total participants
    const participantStats = await eventModel.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: "$participantCount" },
          avgParticipantsPerEvent: { $avg: "$participantCount" },
          totalViews: { $sum: "$views" },
          avgRating: { $avg: "$rating.average" },
        },
      },
    ]);

    // Get most popular events
    const popularEvents = await eventModel
      .find({ createdBy: userId })
      .sort({ participantCount: -1, views: -1 })
      .limit(5)
      .select("name startDate participantCount views rating");

    // Get events by category
    const eventsByCategory = await eventModel.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(userId) } },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Compile statistics
    const stats = {
      eventCounts: {
        total: totalEvents,
        active: activeEvents,
        past: pastEvents,
        cancelled: cancelledEvents,
      },
      participantStats:
        participantStats.length > 0
          ? {
              totalParticipants: participantStats[0].totalParticipants,
              avgParticipantsPerEvent:
                Math.round(participantStats[0].avgParticipantsPerEvent * 10) /
                10,
              totalViews: participantStats[0].totalViews,
              avgRating: Math.round(participantStats[0].avgRating * 10) / 10,
            }
          : {
              totalParticipants: 0,
              avgParticipantsPerEvent: 0,
              totalViews: 0,
              avgRating: 0,
            },
      popularEvents,
      eventsByCategory: eventsByCategory.map((cat) => ({
        category: cat._id,
        count: cat.count,
      })),
    };

    res.status(200).json({
      success: true,
      message: "Organizer statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getOrganizerStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizer statistics",
      error: error.message,
    });
  }
};
