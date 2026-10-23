/**
 * Rolls back users.tutorialCompleted and users.settings.hideTutorialButton.
 *
 *   node scripts/db/tutorialCompletedRollback.js --unset            remove the field from every user
 *   node scripts/db/tutorialCompletedRollback.js --restore <dir>     put back exactly what a backup had
 *
 * Add --yes to actually write; without it this is a dry run.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const db = require("../../db/db");

const args = process.argv.slice(2);
const write = args.includes("--yes");
const restoreAt = args.indexOf("--restore");

(async function () {
  await db.promise;
  const users = mongoose.connection.db.collection("users");

  if (args.includes("--unset")) {
    const n = await users.countDocuments({ tutorialCompleted: { $exists: true } });
    console.log(`${n} users have tutorialCompleted.`);
    if (write) {
      const r = await users.updateMany({ tutorialCompleted: { $exists: true } }, { $unset: { tutorialCompleted: "" } });
      console.log(`Unset on ${r.modifiedCount} users.`);
      const h = await users.updateMany(
        { "settings.hideTutorialButton": { $exists: true } },
        { $unset: { "settings.hideTutorialButton": "" } }
      );
      console.log(`Unset settings.hideTutorialButton on ${h.modifiedCount} users.`);
    } else console.log("Dry run. Add --yes to unset.");
  } else if (restoreAt !== -1 && args[restoreAt + 1]) {
    const docs = JSON.parse(fs.readFileSync(path.join(args[restoreAt + 1], "tutorialCompleted.json"), "utf8"));
    console.log(`Backup has ${docs.length} users. Restoring sets the field to exactly that and unsets it elsewhere.`);
    if (write) {
      const ids = docs.map((d) => d.id);
      await users.updateMany({ tutorialCompleted: { $exists: true }, id: { $nin: ids } }, { $unset: { tutorialCompleted: "" } });
      for (const d of docs) await users.updateOne({ id: d.id }, { $set: { tutorialCompleted: d.tutorialCompleted } });
      const hf = path.join(args[restoreAt + 1], "hideTutorialButton.json");
      if (fs.existsSync(hf)) {
        const hidden = JSON.parse(fs.readFileSync(hf, "utf8"));
        const hids = hidden.map((d) => d.id);
        await users.updateMany(
          { "settings.hideTutorialButton": { $exists: true }, id: { $nin: hids } },
          { $unset: { "settings.hideTutorialButton": "" } }
        );
        for (const d of hidden)
          await users.updateOne({ id: d.id }, { $set: { "settings.hideTutorialButton": d.hideTutorialButton } });
      }
      console.log("Restored.");
    } else console.log("Dry run. Add --yes to restore.");
  } else {
    console.log("Usage: --unset | --restore <backupDir>  [--yes]");
  }
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
