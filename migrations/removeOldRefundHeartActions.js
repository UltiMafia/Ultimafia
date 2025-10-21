const mongoose = require("mongoose");
const models = require("../db/models");
const logger = require("../modules/logging")(".");

/**
 * Migration: Remove old "Refund Red Hearts" and "Refund Gold Hearts" mod actions
 * These commands have been replaced by the unified "Refund Game" command.
 * 
 * Run this migration with: node migrations/removeOldRefundHeartActions.js
 */

async function migrate() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/ultimafia", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info("Connected to database");

    // Find and count the actions to be deleted
    const redHeartActions = await models.ModAction.countDocuments({
      name: "Refund Red Hearts"
    });
    
    const goldHeartActions = await models.ModAction.countDocuments({
      name: "Refund Gold Hearts"
    });

    logger.info(`Found ${redHeartActions} "Refund Red Hearts" actions`);
    logger.info(`Found ${goldHeartActions} "Refund Gold Hearts" actions`);
    logger.info(`Total actions to delete: ${redHeartActions + goldHeartActions}`);

    if (redHeartActions + goldHeartActions === 0) {
      logger.info("No actions to delete. Migration complete.");
      process.exit(0);
      return;
    }

    // Prompt for confirmation (in case you want to add this safety)
    logger.warn("This will permanently delete these mod actions from the database.");
    logger.warn("Press Ctrl+C to cancel, or the script will continue in 5 seconds...");
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete the old actions
    const deleteResult = await models.ModAction.deleteMany({
      name: { $in: ["Refund Red Hearts", "Refund Gold Hearts"] }
    });

    logger.info(`Successfully deleted ${deleteResult.deletedCount} mod actions`);
    logger.info("Migration complete!");

    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrate();

