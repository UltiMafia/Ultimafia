/**
 * Rolls back the per-game event log (#35): drops the gameeventlogchunks
 * collection and its TTL index. Set GAME_EVENT_LOG=off first, or running
 * games will create it again.
 *
 *   node migrations/down/gameEventLog.js --dry-run|--confirm
 */
require("dotenv").config();
const mongoose = require("mongoose");
const db = require("../../db/db");

const dryRun = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--confirm");

(async function () {
  if (!dryRun && !confirmed) throw new Error("Pass --dry-run to preview or --confirm to apply.");
  await db.promise;
  const chunks = mongoose.connection.db.collection("gameeventlogchunks");
  console.log(`gameeventlogchunks has ${await chunks.countDocuments()} chunk(s).`);
  if (!dryRun)
    await chunks.drop().catch((e) => {
      if (e.codeName != "NamespaceNotFound") throw e;
    });
  console.log(dryRun ? "Dry run: nothing changed." : "Game event log collection dropped.");
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
