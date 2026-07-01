const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");
const redis = require("../modules/redis");

async function main() {
  await db.promise;
  console.log("Connected to database.");
  
  console.log("Giving 1,000 coins to all users in MongoDB...");
  const result = await models.User.updateMany({}, { $set: { coins: 1000 } });
  const modifiedCount = result.modifiedCount || result.nModified || 0;
  console.log(`Successfully updated ${modifiedCount} users in MongoDB.`);

  console.log("Fetching all user IDs to refresh Redis cache...");
  const users = await models.User.find({}).select("id").lean().exec();
  
  console.log(`Refreshing cache for ${users.length} users...`);
  for (const u of users) {
    if (u.id) {
      await redis.cacheUserInfo(u.id, true);
    }
  }
  console.log("Redis cache refreshed successfully.");
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Error executing giveCoins script:", err);
  process.exit(1);
});
