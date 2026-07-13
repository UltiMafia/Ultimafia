/**
 * Remove duplicate Game documents that share the same public `id`, then ensure
 * a unique index on `id` exists.
 *
 * Keeps the "richest" document per id (prefers history length, then non-broken,
 * then earliest _id). Retargets/cleans related refs:
 *   - User.games
 *   - ArchivedGame.game
 *   - CompetitiveGameCompletion.game (drops extras after retarget)
 *
 * Does NOT reverse skill-rating or coin side effects from duplicate endPostgame
 * runs — those need a separate audit if required.
 *
 * Run: node migrations/dedupeDuplicateGames.js [--dry-run]
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

function historyScore(game) {
  if (!game.history) return 0;
  try {
    return String(game.history).length;
  } catch (e) {
    return 0;
  }
}

function pickKeeper(games) {
  return games.slice().sort((a, b) => {
    const histDiff = historyScore(b) - historyScore(a);
    if (histDiff !== 0) return histDiff;

    const brokenDiff = Number(!!a.broken) - Number(!!b.broken);
    if (brokenDiff !== 0) return brokenDiff;

    const usersDiff = (b.users || []).length - (a.users || []).length;
    if (usersDiff !== 0) return usersDiff;

    // Prefer earliest insert when otherwise equal
    return String(a._id).localeCompare(String(b._id));
  })[0];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { uri, options } = mongoConnectOptions();
  await mongoose.connect(uri, options);

  console.log(`Connected.${dryRun ? " (dry run)" : ""} Finding duplicate game ids…`);

  const duplicateGroups = await models.Game.aggregate([
    { $group: { _id: "$id", count: { $sum: 1 }, docs: { $push: "$$ROOT" } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log(`Found ${duplicateGroups.length} game id(s) with duplicates.`);

  let deletedGames = 0;
  let pulledUserRefs = 0;
  let retargetedArchives = 0;
  let deletedCompletions = 0;

  for (const group of duplicateGroups) {
    const keeper = pickKeeper(group.docs);
    const duplicates = group.docs.filter(
      (doc) => String(doc._id) !== String(keeper._id)
    );
    const duplicateIds = duplicates.map((doc) => doc._id);

    console.log(
      `  id=${group._id}: keep ${keeper._id}, drop ${duplicateIds.length} duplicate(s)`
    );

    if (dryRun) {
      deletedGames += duplicateIds.length;
      continue;
    }

    const archiveResult = await models.ArchivedGame.updateMany(
      { game: { $in: duplicateIds } },
      { $set: { game: keeper._id } }
    );
    retargetedArchives += archiveResult.modifiedCount || 0;

    // Drop completions that pointed at duplicate ObjectIds. The keeper's own
    // (userId, game) rows are kept; retargeting would collide on that unique index.
    const completionDel = await models.CompetitiveGameCompletion.deleteMany({
      game: { $in: duplicateIds },
    });
    deletedCompletions += completionDel.deletedCount || 0;

    const userResult = await models.User.updateMany(
      { games: { $in: duplicateIds } },
      { $pull: { games: { $in: duplicateIds } } }
    );
    pulledUserRefs += userResult.modifiedCount || 0;

    const gameDel = await models.Game.deleteMany({ _id: { $in: duplicateIds } });
    deletedGames += gameDel.deletedCount || 0;
  }

  console.log(
    `${dryRun ? "Would delete" : "Deleted"} ${deletedGames} duplicate game(s); ` +
      `users touched=${pulledUserRefs}; archives retargeted=${retargetedArchives}; ` +
      `completion dupes removed=${deletedCompletions}`
  );

  if (!dryRun) {
    console.log("Ensuring unique index on games.id…");
    await models.Game.collection.createIndex({ id: 1 }, { unique: true });
    console.log("Unique index ready.");
  } else {
    console.log("Dry run complete — skipped unique index creation.");
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exit(1);
});
