/**
 * Backfill Stamp.borderType for player-bought stamps.
 *
 * Only stamps where originalOwnerId === userId (i.e. the current owner is the
 * person who first earned the stamp) get a tier. Gifted/traded stamps stay
 * at the schema default of "u".
 *
 * Tier from the source Game:
 *   game.competitive  -> "c"
 *   else game.ranked  -> "r"
 *   else              -> "u" (no write)
 *
 * Run: node migrations/backfillStampBorderType.js [--dry-run]
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

  const cursor = models.Stamp.find({
    $expr: { $eq: ["$originalOwnerId", "$userId"] },
    $or: [{ borderType: { $exists: false } }, { borderType: "u" }],
  })
    .select("_id gameId")
    .cursor();

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for await (const stamp of cursor) {
    scanned++;
    try {
      if (!stamp.gameId || stamp.gameId.startsWith("admin-")) {
        skipped++;
      } else {
        const game = await models.Game.findOne({ id: stamp.gameId }).select(
          "ranked competitive"
        );
        if (!game) {
          skipped++;
        } else {
          const borderType = game.competitive ? "c" : game.ranked ? "r" : null;
          if (!borderType) {
            skipped++;
          } else if (dryRun) {
            updated++;
          } else {
            await models.Stamp.updateOne(
              { _id: stamp._id },
              { $set: { borderType } }
            );
            updated++;
          }
        }
      }
    } catch (e) {
      console.error(`Failed stamp ${stamp._id}: ${e.message}`);
      failed++;
    }

    if (scanned % 500 === 0) {
      console.log(
        `Progress: scanned=${scanned} updated=${updated} skipped=${skipped} failed=${failed}`
      );
    }
  }

  console.log(
    `Done. scanned=${scanned} updated=${updated} skipped=${skipped} failed=${failed}${
      dryRun ? " (dry run — no changes written)" : ""
    }`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
