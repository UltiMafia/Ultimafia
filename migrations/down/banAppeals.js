/**
 * Rolls back the ban page / ban appeal data. Take a backup first
 * (scripts/db/banAppealsBackup.js) and pair this with a code rollback.
 *
 *   node migrations/down/banAppeals.js --dry-run|--confirm [--keep-appeals]
 *
 * - Removes reason, createdAt, scope and reportIds from bans (the bans
 *   themselves stay).
 * - Drops the sitebanappeals collection (unless --keep-appeals).
 * - Deletes ban page sessions (sessions with siteBan and no signed-in user);
 *   the old code treats them as signed out anyway.
 * - Deletes the appeal and vote messages posted by the site sender: the old
 *   chat code can't load a channel holding a message with no user behind it.
 *   Older vote messages sent by admins, the "Ban Appeals" channel name and
 *   the "Ban appeal pending" inbox notifications stay; they work with the
 *   old code. Vote justifications live on the appeals (votes.notes), so
 *   --keep-appeals keeps them and dropping the collection removes them.
 */
require("dotenv").config();
const db = require("../../db/db");
const {
  banQuery,
  banSessionQuery,
  siteMessageQuery,
  collection,
} = require("../../scripts/db/banAppealsData");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const confirmed = args.includes("--confirm");
const keepAppeals = args.includes("--keep-appeals");

(async function () {
  if (!dryRun && !confirmed)
    throw new Error("Pass --dry-run to preview or --confirm to apply.");
  await db.promise;
  const bans = await collection("bans").countDocuments(banQuery);
  const exists =
    (await db.conn.db.listCollections({ name: "sitebanappeals" }).toArray())
      .length > 0;
  const appeals = exists
    ? await collection("sitebanappeals").countDocuments({})
    : 0;
  const sessions = await collection("sessions").countDocuments(banSessionQuery);
  const messages =
    await collection("chatmessages").countDocuments(siteMessageQuery);
  console.log(
    `Bans with reason/createdAt/scope/reportIds ${bans}, appeals ${appeals}${keepAppeals ? " (kept)" : ""}, ban page sessions ${sessions}, site appeal messages ${messages}`,
  );

  if (!dryRun) {
    await collection("bans").updateMany(banQuery, {
      $unset: { reason: "", createdAt: "", scope: "", reportIds: "" },
    });
    if (exists && !keepAppeals) await collection("sitebanappeals").drop();
    await collection("sessions").deleteMany(banSessionQuery);
    await collection("chatmessages").deleteMany(siteMessageQuery);
  }
  console.log(
    dryRun ? "Dry run: nothing changed." : "Ban appeal data rolled back.",
  );
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
