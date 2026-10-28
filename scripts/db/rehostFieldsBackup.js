/**
 * Backs up the three game fields added for rehost (originalRanked,
 * originalCompetitive, lobbyNameCustom). Run before deploying and before any
 * rollback; keep the folder until the deploy is accepted. backups/ is
 * git-ignored.
 *
 *   node scripts/db/rehostFieldsBackup.js [backupDir]
 *
 * Writes:
 *   games.json     { _id, id, originalRanked, originalCompetitive,
 *                  lobbyNameCustom } for every game that has any of them
 *   manifest.json  counts
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../../db/db");
const { collection, writeJson } = require("./blockRequestsData");
const { FIELDS, hasAnyField } = require("./rehostFieldsData");

const dir =
  process.argv[2] ||
  path.join(
    "backups",
    `rehost-fields-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );

(async function () {
  await db.promise;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const projection = { id: 1 };
  for (const f of FIELDS) projection[f] = 1;
  const games = await collection("games")
    .find(hasAnyField())
    .project(projection)
    .toArray();
  writeJson(dir, "games", games);
  const manifest = {
    createdAt: new Date().toISOString(),
    gamesWithFields: games.length,
  };
  for (const f of FIELDS)
    manifest[f] = games.filter((g) => g[f] !== undefined).length;
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
