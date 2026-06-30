const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");
const redis = require("../modules/redis");

async function main() {
  await db.promise;
  console.log("Connected to database.");

  // 1. Fetch the two test users
  const bessy = await models.User.findOne({ id: "cCtkSgtqM" }).exec();
  const matronna = await models.User.findOne({ id: "wd8wCtGy2" }).exec();

  if (!bessy || !matronna) {
    console.error("Test users BessyDale71 and MatronnaCchaddie25 must exist.");
    process.exit(1);
  }

  console.log(`Found Bessy (${bessy.name}, ObjectId: ${bessy._id})`);
  console.log(`Found Matronna (${matronna.name}, ObjectId: ${matronna._id})`);

  // 2. Clean up any existing family with the same ID
  await models.Family.deleteOne({ id: "test-fam" });
  await models.InFamily.deleteMany({ user: { $in: [bessy._id, matronna._id] } });

  // 3. Create a family
  const family = await models.Family.create({
    id: "test-fam",
    name: "Test Guild",
    founder: bessy._id,
    leader: bessy._id,
    members: [bessy._id, matronna._id],
    createdAt: Date.now()
  });
  console.log(`Created Family 'Test Guild' (ID: ${family.id}, ObjectId: ${family._id})`);

  // 4. Create InFamily mappings
  await models.InFamily.create({ user: bessy._id, family: family._id });
  await models.InFamily.create({ user: matronna._id, family: family._id });
  console.log("Created InFamily records for both members.");

  // 5. Ensure Bessy has enough coins to pay for the IPO (give Bessy 500 coins just to be sure)
  await models.User.updateOne({ id: bessy.id }, { $set: { coins: 500 } });
  console.log("Granted BessyDale71 500 coins for testing Family IPO.");

  // 6. Refresh redis cache
  await redis.cacheUserInfo(bessy.id, true);
  await redis.cacheUserInfo(matronna.id, true);
  console.log("Redis cache refreshed.");

  console.log("Family setup completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error setting up family stock:", err);
  process.exit(1);
});
