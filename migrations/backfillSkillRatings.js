require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");
const skillRating = require("../modules/skillRating");

async function backfillSkillRatings() {
  try {
    console.log("Starting skill ratings backfill...");

    // 1. Reset all users' skill rating fields
    console.log("Resetting all users' skill ratings to default...");
    const resetUserResult = await models.User.updateMany(
      {},
      {
        $set: {
          "skillRating.mu": 25.0,
          "skillRating.sigma": 25.0 / 3.0,
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

    // 3. Query all ranked or competitive games that successfully ended, sorted chronologically
    console.log("Fetching ranked and competitive games in chronological order...");
    const games = await models.Game.find({
      $or: [{ ranked: true }, { competitive: true }],
      endTime: { $exists: true, $gt: 0 },
      broken: { $ne: true }
    }).sort({ startTime: 1 });

    console.log(`Found ${games.length} games to process.`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const game of games) {
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
        console.log(`Processed ${processedCount}/${games.length} games...`);
      }
    }

    console.log(`Backfill finished. Processed: ${processedCount}, Skipped: ${skippedCount} games.`);
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
