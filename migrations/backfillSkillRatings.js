require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const skillRating = require("../modules/skillRating");
const { DEFAULT_MU, DEFAULT_SIGMA } = require("../modules/skillRating");

async function backfillSkillRatings() {
  try {
    console.log("Starting skill ratings backfill...");

    // 1. Reset all users' skill rating fields
    console.log("Resetting all users' skill ratings to default...");
    const resetUserResult = await models.User.updateMany(
      {},
      {
        $set: {
          "skillRating.mu": DEFAULT_MU,
          "skillRating.sigma": DEFAULT_SIGMA,
          "skillRating.gamesPlayed": 0,
        }
      }
    );
    console.log(`Reset completed for users: matched ${resetUserResult.matchedCount}, modified ${resetUserResult.modifiedCount}`);

    // 2. Clear any existing skillRatingChanges or skillRefunded fields on all games
    console.log("Clearing existing skill changes and refund flags on all games...");
    const resetGameResult = await models.Game.updateMany(
      {},
      {
        $set: {
          skillRatingChanges: [],
          skillRefunded: false
        }
      }
    );
    console.log(`Clear completed for games: matched ${resetGameResult.matchedCount}, modified ${resetGameResult.modifiedCount}`);

    // 3. Stream ranked/competitive games chronologically instead of loading all into memory
    console.log("Streaming ranked and competitive games in chronological order...");
    const cursor = models.Game.find({
      $or: [{ ranked: true }, { competitive: true }],
      endTime: { $exists: true, $gt: 0 },
      broken: { $ne: true }
    }).sort({ startTime: 1 }).lean().cursor();

    let processedCount = 0;
    let skippedCount = 0;
    let totalCount = 0;

    for await (const game of cursor) {
      totalCount++;

      // Check if the game has players
      const playerIdMap = typeof game.playerIdMap === "string" ? JSON.parse(game.playerIdMap || "{}") : (game.playerIdMap || {});
      const userIds = Object.keys(playerIdMap);

      if (userIds.length === 0) {
        skippedCount++;
        continue;
      }

      await skillRating.updateGameRatings(game);
      processedCount++;

      if (processedCount % 50 === 0) {
        console.log(`Processed ${processedCount} games (${totalCount} seen so far)...`);
      }
    }

    console.log(`Backfill finished. Processed: ${processedCount}, Skipped: ${skippedCount}, Total: ${totalCount} games.`);
  } catch (error) {
    console.error("Backfill failed:", error);
    throw error;
  }
}

if (require.main === module) {
  const db = require("../db/db");

  backfillSkillRatings()
    .then(() => {
      console.log("Backfill successful!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}

module.exports = backfillSkillRatings;
