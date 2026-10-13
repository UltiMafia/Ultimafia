/**
 * Rolls back GitHub links: unsets every user's github field, drops its
 * index, and removes approveGithubLinks from every group. Pair it with a code
 * rollback, or startup gives Admin the permission again.
 *
 *   node migrations/down/githubLinks.js --dry-run|--confirm [--delete-mod-actions]
 *
 * "Review GitHub Link" mod actions are kept unless --delete-mod-actions is passed.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const db = require("../../db/db");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const confirmed = args.includes("--confirm");
const deleteModActions = args.includes("--delete-mod-actions");

(async function () {
  if (!dryRun && !confirmed) throw new Error("Pass --dry-run to preview or --confirm to apply.");
  await db.promise;
  const collection = (name) => mongoose.connection.db.collection(name);
  const linked = await collection("users").countDocuments({ github: { $exists: true } });
  const actions = await collection("modactions").countDocuments({ name: "Review GitHub Link" });
  console.log(`Users with a GitHub link ${linked}, review mod actions ${actions}`);

  if (!dryRun) {
    await collection("users").updateMany({ github: { $exists: true } }, { $unset: { github: "" } });
    await collection("users").dropIndex("github.status_1").catch((e) => {
      if (e.codeName != "IndexNotFound") throw e;
    });
    await collection("groups").updateMany({}, { $pull: { permissions: "approveGithubLinks" } });
    if (deleteModActions) await collection("modactions").deleteMany({ name: "Review GitHub Link" });
  }
  console.log(dryRun ? "Dry run: nothing changed." : "GitHub link data rolled back. Restart www.");
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
