/**
 * Wipe all player moderation records for a clean-slate rules reset.
 *
 * Deletes:
 *   - Report
 *   - ViolationTicket
 *   - Appeal
 *   - Manual bans issued via reports or in-panel bans
 *     (site, game, chat, forum, playRanked, playCompetitive)
 *
 * Also clears User.banned for users who had a site ban of those types.
 *
 * Does NOT delete:
 *   - gameAuto bans (in-game ranked/competitive chat locks)
 *   - ipFlag bans
 *   - ModAction history
 *   - LeavePenalty
 *   - notifications
 *
 * Run:
 *   node migrations/wipeModerationRecords.js --dry-run
 *   node migrations/wipeModerationRecords.js --confirm
 *
 * Requires .env with MONGO_URL / MONGO_DB / MONGO_USER / MONGO_PW
 * (same as other migrations / docs/server_env). Redis should be up so
 * permission caches can be cleared; the wipe still applies if Redis is down.
 */

require("dotenv").config();
const models = require("../db/models");

const dryRun = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--confirm");

const REPORT_BAN_TYPES = [
  "forum",
  "chat",
  "game",
  "playRanked",
  "playCompetitive",
  "site",
];

async function countModel(name, filter = {}) {
  const count = await models[name].countDocuments(filter);
  console.log(`  ${name}: ${count}`);
  return count;
}

async function migrate() {
  if (!dryRun && !confirmed) {
    throw new Error(
      "Refusing to wipe without --confirm. Preview with --dry-run, then run:\n  node migrations/wipeModerationRecords.js --confirm"
    );
  }

  console.log(
    dryRun
      ? "DRY RUN — no documents will be deleted."
      : "WIPING all reports, violation tickets, appeals, and related bans..."
  );

  const banFilter = { type: { $in: REPORT_BAN_TYPES } };

  console.log("Current counts:");
  const reportCount = await countModel("Report");
  const ticketCount = await countModel("ViolationTicket");
  const appealCount = await countModel("Appeal");
  const banCount = await countModel("Ban", banFilter);

  const siteBannedUserIds = await models.Ban.distinct("userId", {
    type: "site",
  });
  console.log(`  Users with a site Ban: ${siteBannedUserIds.length}`);

  const totals = {
    reports: reportCount,
    violationTickets: ticketCount,
    appeals: appealCount,
    bans: banCount,
    siteBannedUsers: siteBannedUserIds.length,
  };

  if (dryRun) {
    console.log("Would delete the counts above. Re-run with --confirm to apply.");
    return { dryRun: true, ...totals };
  }

  const reportResult = await models.Report.deleteMany({});
  console.log(`Deleted ${reportResult.deletedCount} Report document(s).`);

  const ticketResult = await models.ViolationTicket.deleteMany({});
  console.log(`Deleted ${ticketResult.deletedCount} ViolationTicket document(s).`);

  const appealResult = await models.Appeal.deleteMany({});
  console.log(`Deleted ${appealResult.deletedCount} Appeal document(s).`);

  const banResult = await models.Ban.deleteMany(banFilter);
  console.log(`Deleted ${banResult.deletedCount} Ban document(s).`);

  let unbannedCount = 0;
  if (siteBannedUserIds.length > 0) {
    const unbanResult = await models.User.updateMany(
      { id: { $in: siteBannedUserIds } },
      { $set: { banned: false } }
    );
    unbannedCount = unbanResult.modifiedCount;
    console.log(`Cleared User.banned on ${unbannedCount} user(s).`);
  }

  try {
    const redis = require("../modules/redis");
    await redis.clearPermissionCache();
    const rankKeys = await redis.client.keysAsync("user:*:rank");
    for (const key of rankKeys) {
      await redis.client.delAsync(key);
    }
    console.log("Cleared Redis permission and rank caches.");
  } catch (err) {
    console.warn(
      "Could not clear Redis caches (okay if Redis is down). They expire within ~1 hour.",
      err.message
    );
  }

  return {
    dryRun: false,
    deletedReports: reportResult.deletedCount,
    deletedViolationTickets: ticketResult.deletedCount,
    deletedAppeals: appealResult.deletedCount,
    deletedBans: banResult.deletedCount,
    unbannedUsers: unbannedCount,
  };
}

if (require.main === module) {
  const db = require("../db/db");

  db.promise
    .then(() => migrate())
    .then((result) => {
      console.log("Migration complete.", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = migrate;
