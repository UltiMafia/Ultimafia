/**
 * Rolls back the Developer API data (reverse of the Developer API deploy and of
 * migrations/replaceDevGroupWithDeveloper.js). Pair it with a code rollback,
 * or startup will recreate the Developer groups.
 *
 *   node migrations/down/developerApi.js --dry-run|--confirm [--backup <dir>]
 *
 * - Restores the "Dev" group (from the backup when it has one, otherwise the
 *   old default: rank 5, hidden, no permissions) and its backed-up members.
 * - Deletes the "Developer" and "Developer Public Testing" groups and memberships.
 * - Removes devApi and devTestPublic from every group.
 * - Drops the devapikeys collection.
 * Restart www afterwards; startup clears the permission cache.
 */
require("dotenv").config();
const shortid = require("shortid");
const db = require("../../db/db");
const { collection, readJson } = require("../../scripts/db/featureData");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const confirmed = args.includes("--confirm");
const backupIndex = args.indexOf("--backup");
const backupDir = backupIndex == -1 ? null : args[backupIndex + 1];
const developerGroups = ["Developer", "Developer Public Testing"];
const perms = ["devApi", "devTestPublic"];

async function restoreDevGroup() {
  if (await collection("groups").findOne({ name: "Dev" })) return "Dev group already exists.";
  const backupGroups = backupDir ? readJson(backupDir, "groups") || [] : [];
  const backed = backupGroups.find((g) => g.name == "Dev");
  const group = backed || { id: shortid.generate(), name: "Dev", rank: 5, permissions: [], visible: false };
  const members = backed ? (readJson(backupDir, "ingroups") || []).filter((m) => String(m.group) == String(backed._id)) : [];
  if (!dryRun) {
    const { insertedId } = await collection("groups").insertOne(group);
    for (const member of members) await collection("ingroups").insertOne({ user: member.user, group: insertedId });
  }
  const verb = dryRun ? "Would restore" : "Restored";
  return `${verb} the Dev group ${backed ? "from backup" : "with the old defaults"} with ${members.length} member(s).`;
}

(async function () {
  if (!dryRun && !confirmed) throw new Error("Pass --dry-run to preview or --confirm to apply.");
  await db.promise;
  console.log(await restoreDevGroup());

  const groups = await collection("groups").find({ name: { $in: developerGroups } }).toArray();
  const groupIds = groups.map((g) => g._id);
  const memberships = await collection("ingroups").countDocuments({ group: { $in: groupIds } });
  const keys = await collection("devapikeys").countDocuments();
  console.log(`Developer groups ${groups.length}, memberships ${memberships}, developer API keys ${keys}`);

  if (!dryRun) {
    await collection("ingroups").deleteMany({ group: { $in: groupIds } });
    await collection("groups").deleteMany({ _id: { $in: groupIds } });
    await collection("groups").updateMany({}, { $pull: { permissions: { $in: perms } } });
    await collection("devapikeys").drop().catch((e) => {
      if (e.codeName != "NamespaceNotFound") throw e;
    });
  }
  console.log(dryRun ? "Dry run: nothing changed." : "Developer API data rolled back. Restart www.");
  process.exit(0);
})().catch((e) => {
  console.error("Rollback failed:", e.message);
  process.exit(1);
});
