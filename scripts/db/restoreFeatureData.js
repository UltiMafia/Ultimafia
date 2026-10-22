/**
 * Restores feature data from a backupFeatureData.js folder without deleting
 * anything that exists now. Run it before restarting www so startup does not
 * create duplicate groups.
 *
 *   node scripts/db/restoreFeatureData.js <backupDir> [--only groups,devapikeys,users,modactions] [--dry-run]
 *
 * groups: inserts missing groups (matched by name) and their memberships.
 * devapikeys, modactions: inserts documents missing by _id.
 * users: sets github and contributorTypes back to the backed-up values.
 */
require("dotenv").config();
const db = require("../../db/db");
const { collection, readJson } = require("./featureData");

const args = process.argv.slice(2);
const dir = args[0];
const onlyIndex = args.indexOf("--only");
const only = onlyIndex == -1 ? ["groups", "devapikeys", "users", "modactions"] : args[onlyIndex + 1].split(",");
const dryRun = args.includes("--dry-run");

async function restoreGroups() {
  const groups = readJson(dir, "groups") || [];
  const memberships = readJson(dir, "ingroups") || [];
  const groupIds = new Map();
  let created = 0;
  let added = 0;
  for (const group of groups) {
    const existing = await collection("groups").findOne({ name: group.name });
    if (existing) groupIds.set(String(group._id), existing._id);
    else {
      if (!dryRun) await collection("groups").insertOne(group);
      groupIds.set(String(group._id), group._id);
      created++;
    }
  }
  for (const membership of memberships) {
    const group = groupIds.get(String(membership.group));
    if (!group) continue;
    const exists = await collection("ingroups").findOne({ user: membership.user, group });
    if (exists) continue;
    if (!dryRun) await collection("ingroups").insertOne({ ...membership, group });
    added++;
  }
  console.log(`groups: created ${created}, memberships added ${added}`);
}

async function restoreMissing(name) {
  const docs = readJson(dir, name) || [];
  let inserted = 0;
  for (const doc of docs) {
    if (await collection(name).findOne({ _id: doc._id }, { projection: { _id: 1 } })) continue;
    if (!dryRun) await collection(name).insertOne(doc);
    inserted++;
  }
  console.log(`${name}: inserted ${inserted}`);
}

async function restoreUsers() {
  const users = readJson(dir, "users") || [];
  let updated = 0;
  for (const user of users) {
    const set = { contributorTypes: user.contributorTypes || [] };
    if (user.github) set.github = user.github;
    const update = user.github ? { $set: set } : { $set: set, $unset: { github: "" } };
    if (!dryRun) await collection("users").updateOne({ id: user.id }, update);
    updated++;
  }
  console.log(`users: updated ${updated}`);
}

(async function () {
  if (!dir) throw new Error("Pass the backup folder.");
  await db.promise;
  if (only.includes("groups")) await restoreGroups();
  if (only.includes("devapikeys")) await restoreMissing("devapikeys");
  if (only.includes("modactions")) await restoreMissing("modactions");
  if (only.includes("users")) await restoreUsers();
  console.log(dryRun ? "Dry run: nothing changed." : "Restore done. Restart www to refresh permission caches.");
  process.exit(0);
})().catch((e) => {
  console.error("Restore failed:", e.message);
  process.exit(1);
});
