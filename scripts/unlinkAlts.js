const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");
const redis = require("../modules/redis");

async function main() {
  await db.promise;
  console.log("Connected to database.");

  console.log("Fetching all users...");
  const users = await models.User.find({}).exec();
  console.log(`Found ${users.length} users in the database.`);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const uniqueIp = [`dummy-ip-address-${i + 1}`];
    
    console.log(`Updating user '${user.name}' (${user.id}) IP to:`, uniqueIp);
    await models.User.updateOne({ id: user.id }, { $set: { ip: uniqueIp } });
    
    console.log(`Refreshing Redis cache for '${user.name}'...`);
    await redis.cacheUserInfo(user.id, true);
  }

  console.log("All test accounts have been unlinked and cache has been refreshed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error executing unlinkAlts script:", err);
  process.exit(1);
});
