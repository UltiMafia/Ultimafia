/**
 * Rollback for the rehost fields on games (originalRanked,
 * originalCompetitive, lobbyNameCustom).
 *
 * The previous code never reads these fields, so redeploying it is enough on
 * its own; this script is optional cleanup. Without --yes it only counts.
 *
 *   node migrations/down/rehostFields.js                 # dry run
 *   node migrations/down/rehostFields.js --yes           # $unset the fields
 *   node migrations/down/rehostFields.js --restore <backupDir> --yes
 *                                                        # put a backup back
 *
 * Take scripts/db/rehostFieldsBackup.js first. Games without the fields
 * (everything saved before the deploy) still rehost: ranked/competitive fall
 * back to the saved values and the lobby name is compared with the players'
 * default names.
 */
require("dotenv").config();
const db = require("../../db/db");
const { collection, readJson } = require("../../scripts/db/blockRequestsData");
const { FIELDS, hasAnyField } = require("../../scripts/db/rehostFieldsData");

const args = process.argv.slice(2);
const apply = args.includes("--yes");
const restoreIdx = args.indexOf("--restore");
const restoreDir = restoreIdx >= 0 ? args[restoreIdx + 1] : null;

(async function () {
  await db.promise;
  const games = collection("games");

  if (restoreIdx >= 0) {
    if (!restoreDir) throw new Error("--restore needs a backup folder");
    const docs = readJson(restoreDir, "games");
    if (!docs) throw new Error(`no games.json in ${restoreDir}`);
    const ops = docs.map((d) => {
      const set = {};
      for (const f of FIELDS) if (d[f] !== undefined) set[f] = d[f];
      return { updateOne: { filter: { _id: d._id }, update: { $set: set } } };
    });
    if (apply && ops.length) await games.bulkWrite(ops, { ordered: false });
    console.log(
      `${apply ? "restored" : "would restore"} fields on ${ops.length} games`,
    );
    process.exit(0);
  }

  const count = await games.countDocuments(hasAnyField());
  if (apply) {
    const unset = {};
    for (const f of FIELDS) unset[f] = "";
    await games.updateMany(hasAnyField(), { $unset: unset });
  }
  console.log(
    `${apply ? "unset" : "would unset"} ${FIELDS.join(", ")} on ${count} games`,
  );
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
