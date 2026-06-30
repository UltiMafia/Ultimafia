const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");
const redis = require("../modules/redis");
const { syncRankedCompetitiveAccess } = require("../modules/userEligibility");

async function main() {
  await db.promise;
  console.log("Connected to database.");

  // 1. Find or create Ranked Player & Competitive Player groups
  let rankedGroup = await models.Group.findOne({ name: "Ranked Player" });
  if (!rankedGroup) {
    console.log("Ranked Player group not found, creating it...");
    rankedGroup = await models.Group.create({ name: "Ranked Player", permissions: [] });
  }
  
  let compGroup = await models.Group.findOne({ name: "Competitive Player" });
  if (!compGroup) {
    console.log("Competitive Player group not found, creating it...");
    compGroup = await models.Group.create({ name: "Competitive Player", permissions: [] });
  }

  // 2. Fetch all users
  const users = await models.User.find({}).exec();
  console.log(`Found ${users.length} users to rank approve.`);

  for (const user of users) {
    console.log(`Approving user: ${user.name} (${user.id})`);
    
    // Add fake games so they have gamesPlayed >= 5
    if (!user.games || user.games.length < 5) {
      const mongoose = require("mongoose");
      const fakeGames = user.games || [];
      while (fakeGames.length < 5) {
        fakeGames.push(new mongoose.Types.ObjectId());
      }
      await models.User.updateOne({ id: user.id }, { $set: { games: fakeGames, points: 1000 } });
    }

    // Add InGroup entries
    await models.InGroup.findOneAndUpdate(
      { user: user._id, group: rankedGroup._id },
      { user: user._id, group: rankedGroup._id },
      { upsert: true }
    );
    await models.InGroup.findOneAndUpdate(
      { user: user._id, group: compGroup._id },
      { user: user._id, group: compGroup._id },
      { upsert: true }
    );

    // Run eligibility sync to generate cache keys
    const result = await syncRankedCompetitiveAccess(user.id, { minimumGames: 0, minimumPoints: 0 });
    console.log(`Sync result for ${user.name}:`, result);

    // Refresh redis caches
    await redis.cacheUserInfo(user.id, true);
    await redis.cacheUserPermissions(user.id);
  }

  console.log("Both users have been rank approved and cleared for ranked/comp play!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error in rankApprove script:", err);
  process.exit(1);
});
