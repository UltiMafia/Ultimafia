const mongoose = require("mongoose");
const models = require("../db/models");

async function addReadFieldToNotifications() {
  try {
    console.log("Starting migration: Adding 'read' field to existing notifications...");

    // Update all notifications that don't have a 'read' field
    const result = await models.Notification.updateMany(
      { read: { $exists: false } },
      { $set: { read: false } }
    );

    console.log(`Migration complete! Updated ${result.modifiedCount} notifications.`);
    console.log(`Matched ${result.matchedCount} notifications without 'read' field.`);

    return result;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const db = require("../db/db");
  
  addReadFieldToNotifications()
    .then(() => {
      console.log("Migration successful!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = addReadFieldToNotifications;

