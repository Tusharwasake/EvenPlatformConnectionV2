import { participantModel } from "../models/participantsModel.js";
import { eventModel } from "../models/eventModel.js";
import { mailsender } from "../emailSender/emailSender.js";
import "dotenv/config";

// Mark participant as present and send OTP email
export const markAttendance = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Validate required fields
    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Event ID are required",
      });
    }

    // Check if the event manager has permission (must be the event creator or an admin)
    if (req.user.role !== "organizer") {
      const event = await eventModel.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (event.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Only event managers can mark attendance",
        });
      }
    }

    // Find the participant
    const participant = await participantModel.findOne({
      userId: userId,
      eventId: eventId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found for this event",
      });
    }

    // Check if already marked as present
    if (participant.isPresent) {
      return res.status(400).json({
        success: false,
        message: "Participant already marked as present",
      });
    }

    // Update participant as present
    participant.isPresent = true;
    participant.presentTime = new Date();
    await participant.save();

    // Get user email (assuming user model has email field)
    // You might need to adjust this based on your actual user model implementation
    const user = await participantModel
      .findOne({ userId })
      .populate("userId", "email name");
    const userEmail = user?.userId?.email || process.env.GMAIL;
    const userName = user?.userId?.name || "Participant";

    // Get event details for the email
    const event = await eventModel.findById(eventId);

    // Send email with OTP
    const emailSubject = `Your Access Code for ${event.name}`;
    const emailBody = `
      Hello ${userName},
      
      You have been marked as present at "${event.name}".
      
      Your access code to enter the event lobby is: ${participant.code}
      
      This code will allow you to access the event lobby, connect with other attendees, 
      and participate in event activities.
      
      Enjoy the event!
    `;

    mailsender(userEmail, emailSubject, emailBody);

    res.status(200).json({
      success: true,
      message: "Participant marked as present and OTP sent",
      data: {
        participantId: participant._id,
        isPresent: participant.isPresent,
        presentTime: participant.presentTime,
      },
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

// Mark multiple participants as present
export const markBulkAttendance = async (req, res) => {
  try {
    const { participants, eventId } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0 ||
      !eventId
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid participants array and event ID are required",
      });
    }

    // Check if the event manager has permission
    if (req.user.role !== "organizer") {
      const event = await eventModel.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (event.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Only event managers can mark attendance",
        });
      }
    }

    // Get event details for the email
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const results = [];
    const errors = [];

    // Process each participant
    for (const userId of participants) {
      try {
        // Find the participant
        const participant = await participantModel.findOne({
          userId: userId,
          eventId: eventId,
        });

        if (!participant) {
          errors.push({
            userId,
            message: "Participant not found for this event",
          });
          continue;
        }

        // Update participant as present if not already
        if (!participant.isPresent) {
          participant.isPresent = true;
          participant.presentTime = new Date();
          await participant.save();

          // Get user email
          const user = await participantModel
            .findOne({ userId })
            .populate("userId", "email name");
          const userEmail = user?.userId?.email || process.env.GMAIL;
          const userName = user?.userId?.name || "Participant";

          // Send email with OTP
          const emailSubject = `Your Access Code for ${event.name}`;
          const emailBody = `
            Hello ${userName},
            
            You have been marked as present at "${event.name}".
            
            Your access code to enter the event lobby is: ${participant.code}
            
            This code will allow you to access the event lobby, connect with other attendees, 
            and participate in event activities.
            
            Enjoy the event!
          `;

          mailsender(userEmail, emailSubject, emailBody);

          results.push({
            userId,
            participantId: participant._id,
            status: "Marked as present and OTP sent",
            isPresent: true,
          });
        } else {
          results.push({
            userId,
            participantId: participant._id,
            status: "Already marked as present",
            isPresent: true,
          });
        }
      } catch (error) {
        errors.push({
          userId,
          message: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Bulk attendance marking completed",
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors,
      },
    });
  } catch (error) {
    console.error("Error marking bulk attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark bulk attendance",
      error: error.message,
    });
  }
};

// Get attendance status for an event
export const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Check if the event exists
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if the user has permission (must be the event creator or an admin)
    if (
      req.user.role !== "organizer" &&
      event.createdBy.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view attendance for this event",
      });
    }

    // Get all participants for this event
    const participants = await participantModel
      .find({ eventId })
      .populate("userId", "name email")
      .select("userId isPresent presentTime code");

    // Calculate stats
    const totalParticipants = participants.length;
    const presentParticipants = participants.filter((p) => p.isPresent).length;
    const absentParticipants = totalParticipants - presentParticipants;

    res.status(200).json({
      success: true,
      data: {
        eventId,
        eventName: event.name,
        stats: {
          total: totalParticipants,
          present: presentParticipants,
          absent: absentParticipants,
          presentPercentage:
            totalParticipants > 0
              ? ((presentParticipants / totalParticipants) * 100).toFixed(2)
              : 0,
        },
        participants,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance data",
      error: error.message,
    });
  }
};

// Check if a user is marked as present for an event
export const checkAttendanceStatus = async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Event ID are required",
      });
    }

    // Find the participant
    const participant = await participantModel.findOne({
      userId,
      eventId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found for this event",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        participantId: participant._id,
        userId,
        eventId,
        isPresent: participant.isPresent || false,
        presentTime: participant.presentTime || null,
        registrationTime: participant.createdAt,
      },
    });
  } catch (error) {
    console.error("Error checking attendance status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check attendance status",
      error: error.message,
    });
  }
};
