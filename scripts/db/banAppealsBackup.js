/**
 * Backs up the data the ban page / ban appeal feature adds. Run before
 * deploying and before any rollback; keep the folder until the deploy is
 * accepted. backups/ is git-ignored.
 *
 *   node scripts/db/banAppealsBackup.js [backupDir]
 *
 * Writes:
 *   bans.json            { id, userId, type, reason, createdAt } for bans that have them
 *   sitebanappeals.json  every ban appeal
 *   sitemessages.json    appeal messages posted by the site sender
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../../db/db");
const {
  banQuery,
  banProjection,
  siteMessageQuery,
  collection,
  writeJson,
} = require("./banAppealsData");

const dir =
  process.argv[2] ||
  path.join(
    "backups",
    `ban-appeals-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const bans = await collection("bans")
    .find(banQuery)
    .project(banProjection)
    .toArray();
  const appeals = await collection("sitebanappeals").find({}).toArray();
  writeJson(dir, "bans", bans);
  const messages = await collection("chatmessages")
    .find(siteMessageQuery)
    .toArray();
  writeJson(dir, "sitebanappeals", appeals);
  writeJson(dir, "sitemessages", messages);
  const manifest = {
    createdAt: new Date().toISOString(),
    bansWithFields: bans.length,
    appeals: appeals.length,
    siteMessages: messages.length,
  };
  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`Backup written to ${dir}`, JSON.stringify(manifest));
  process.exit(0);
})().catch((e) => {
  console.error("Backup failed:", e.message);
  process.exit(1);
});
