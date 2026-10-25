/**
 * Re-applies a ban appeals backup after a rollback, once the code is deployed
 * again. Only bans that still exist get their reason back.
 *
 *   node scripts/db/banAppealsRestore.js <backupDir>
 */
require("dotenv").config();
const db = require("../../db/db");
const { collection, readJson } = require("./banAppealsData");

const dir = process.argv[2];

(async function () {
  if (!dir) throw new Error("Pass the backup folder.");
  await db.promise;
  const bans = readJson(dir, "bans") || [];
  const appeals = readJson(dir, "sitebanappeals") || [];
  let restoredBans = 0;
  for (const ban of bans) {
    const set = {};
    if (ban.reason != null) set.reason = ban.reason;
    if (ban.createdAt != null) set.createdAt = ban.createdAt;
    const r = await collection("bans").updateOne({ id: ban.id }, { $set: set });
    restoredBans += r.modifiedCount;
  }
  let restoredAppeals = 0;
  for (const appeal of appeals) {
    const r = await collection("sitebanappeals").updateOne(
      { banId: appeal.banId },
      { $setOnInsert: appeal },
      { upsert: true },
    );
    restoredAppeals += r.upsertedCount;
  }
  let restoredMessages = 0;
  for (const message of readJson(dir, "sitemessages") || []) {
    const r = await collection("chatmessages").updateOne(
      { id: message.id },
      { $setOnInsert: message },
      { upsert: true },
    );
    restoredMessages += r.upsertedCount;
  }
  console.log(
    `Restored reasons on ${restoredBans} bans, ${restoredAppeals} appeals and ${restoredMessages} site messages.`,
  );
  process.exit(0);
})().catch((e) => {
  console.error("Restore failed:", e.message);
  process.exit(1);
});
