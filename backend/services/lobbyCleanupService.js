import schedule from "node-schedule";
import { eventModel } from "../models/eventModel.js";
import { lobbyModel } from "../models/lobbyEventModel.js";

/**
 * Service to automatically delete lobbies 15 days after their events end
 * Runs once daily to check for lobbies eligible for deletion
 */
class LobbyCleanupService {
  constructor() {
    this.job = null;
  }

  /**
   * Start the scheduled job to run at midnight every day
   */
  startScheduledJob() {
    // Run at midnight (00:00) every day
    this.job = schedule.scheduleJob("0 0 * * *", async () => {
      console.log(
        `[${new Date().toISOString()}] Running scheduled lobby cleanup task`
      );
      await this.cleanupExpiredLobbies();
    });
    console.log("Lobby cleanup service scheduled successfully");
  }

  /**
   * Clean up lobbies that belong to events that ended more than 15 days ago
   */
  async cleanupExpiredLobbies() {
    try {
      // Calculate the date 15 days ago
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      console.log(
        `Looking for events that ended before: ${fifteenDaysAgo.toISOString()}`
      );

      // Find all events that ended more than 15 days ago
      const expiredEvents = await eventModel.find({
        endDate: { $lt: fifteenDaysAgo },
      });

      if (expiredEvents.length === 0) {
        console.log("No expired events found for lobby cleanup");
        return;
      }

      console.log(`Found ${expiredEvents.length} expired events`);

      // Get the IDs of expired events
      const expiredEventIds = expiredEvents.map((event) => event._id);

      // Find and delete all lobbies that belong to these expired events
      const result = await lobbyModel.deleteMany({
        eventId: { $in: expiredEventIds },
      });

      console.log(`Deleted ${result.deletedCount} expired lobbies`);

      // Optional: Log details of the deleted lobbies for audit purposes
      if (result.deletedCount > 0) {
        // You could log more details to a database or file if needed
      }
    } catch (error) {
      console.error("Error during lobby cleanup task:", error);
    }
  }

  /**
   * Run the cleanup task immediately (for manual triggering or testing)
   */
  async runCleanupNow() {
    console.log(
      `[${new Date().toISOString()}] Running manual lobby cleanup task`
    );
    await this.cleanupExpiredLobbies();
  }

  /**
   * Stop the scheduled job
   */
  stopScheduledJob() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log("Lobby cleanup service stopped");
    }
  }
}

// Create and export a singleton instance
const lobbyCleanupService = new LobbyCleanupService();
export default lobbyCleanupService;
