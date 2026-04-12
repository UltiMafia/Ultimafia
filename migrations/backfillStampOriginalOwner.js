/**
 * Backfill Stamp.originalOwnerId and Stamp.originalOwner for existing stamps.
 *
 * Sets originalOwnerId = userId and originalOwner = user for all stamps
 * that don't yet have originalOwnerId set.
 *
 * Run: node migrations/backfillStampOriginalOwner.js [--dry-run]
 * Requires .env with MONGO_URL / MONGO_DB / MONGO_USER / MONGO_PW.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const models = require("../db/models");

function mongoConnectOptions() {
  const rawUrl = (process.env.MONGO_URL || "").trim();
  const hasScheme = /^mongodb(\+srv)?:\/\//i.test(rawUrl);

  if (hasScheme) {
    return {
      uri: rawUrl,
      options: {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PW,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    };
  }

  const host = rawUrl || "localhost:27017";
  const dbName = process.env.MONGO_DB || "ultimafia";

  return {
    uri: `mongodb://${host}/${dbName}?authSource=admin`,
    options: {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PW,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  console.log(`Connected.${dryRun ? " (dry run)" : ""} Scanning stamps…`);

  const stamps = await models.Stamp.find({
    $or: [
      { originalOwnerId: null },
      { originalOwnerId: { $exists: false } },
    ],
  }).select("_id userId user");

  console.log(`Found ${stamps.length} stamps to backfill.`);

  if (dryRun) {
    console.log("Dry run — no changes made.");
    process.exit(0);
  }

  let updated = 0;
  let failed = 0;

  for (const stamp of stamps) {
    try {
      await models.Stamp.updateOne(
        { _id: stamp._id },
        {
          $set: {
            originalOwnerId: stamp.userId,
            originalOwner: stamp.user,
          },
        }
      );
      updated++;
    } catch (e) {
      console.error(`Failed stamp ${stamp._id}: ${e.message}`);
      failed++;
    }
  }

  console.log(`Done. Updated: ${updated}, Failed: ${failed}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
