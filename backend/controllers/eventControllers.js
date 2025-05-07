import { eventModel } from "../models/eventModel.js";

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      imageUrl,
      startDate,
      endDate,
      category,
    } = req.body;
    const eventCategory = category && category.length > 0 ? category : [];

    const createdBy = req.user.userId;

    // Validate required fields
    if (
      !name ||
      !description ||
      !location ||
      !imageUrl ||
      !startDate ||
      !endDate ||
      !eventCategory ||
      !createdBy
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const payload = {
      name,
      description,
      location,
      imageUrl,
      category: eventCategory,
      startDate,
      endDate,
      createdBy,
      participantCount: 0, // Initialize participant count
    };

    const createdEvent = await eventModel.create(payload);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: createdEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all events
export const  getAllEvents = async (req, res) => {
  try {
    const allEvents = await eventModel
      .find({})
      .populate("createdBy", "name email")
      .sort({ startDate: 1 }); // Sort by upcoming events

    res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      count: allEvents.length,
      data: allEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await eventModel
      .findById(req.params.id)
      .populate("createdBy", "name email");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event retrieved successfully",
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const updateData = req.body;

    // Find event first to verify ownership if needed
    const event = await eventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the creator of the event (optional authorization check)
    if (
      req.user.role !== "organizer" &&
      event.createdBy.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this event",
      });
    }

    const updatedEvent = await eventModel.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Find event first to verify ownership if needed
    const event = await eventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the creator of the event (optional authorization check)
    if (
      req.user.role !== "organizer" &&
      event.createdBy.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this event",
      });
    }

    const deletedEvent = await eventModel.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: deletedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get events by category
export const getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const events = await eventModel
      .find({ category: { $in: [category] } })
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      message: `Events in category '${category}' retrieved successfully`,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get events created by a specific user
export const getEventsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const events = await eventModel
      .find({ createdBy: userId })
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      message: "User's events retrieved successfully",
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get upcoming events (events with start date in the future)
export const getUpcomingEvents = async (req, res) => {
  try {
    const currentDate = new Date();

    const upcomingEvents = await eventModel
      .find({
        startDate: { $gte: currentDate },
      })
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      message: "Upcoming events retrieved successfully",
      count: upcomingEvents.length,
      data: upcomingEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get past events (events with end date in the past)
export const getPastEvents = async (req, res) => {
  try {
    const currentDate = new Date();

    const pastEvents = await eventModel
      .find({
        endDate: { $lt: currentDate },
      })
      .populate("createdBy", "name email")
      .sort({ endDate: -1 });

    res.status(200).json({
      success: true,
      message: "Past events retrieved successfully",
      count: pastEvents.length,
      data: pastEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
