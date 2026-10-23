/**
 * Removes the unused hidden "Dev" group, which the "Developer" group replaces.
 * Lists every former member first so an Owner can decide who to add to
 * "Developer". Nobody is moved automatically.
 *
 * Run:
 *   node migrations/replaceDevGroupWithDeveloper.js --dry-run
 *   node migrations/replaceDevGroupWithDeveloper.js --confirm
 */

require("dotenv").config();
const db = require("../db/db");
const models = require("../db/models");

const dryRun = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--confirm");

(async function () {
  if (!dryRun && !confirmed) {
    console.log("Pass --dry-run to preview or --confirm to apply.");
    process.exit(1);
  }

  try {
    await db.promise;
    const group = await models.Group.findOne({ name: "Dev" }).select("_id");
    if (!group) {
      console.log("No Dev group found. Nothing to do.");
      process.exit(0);
    }

    const members = await models.InGroup.find({ group: group._id }).populate(
      "user",
      "id name -_id"
    );
    console.log(`Dev group has ${members.length} member(s):`);
    for (const member of members)
      console.log(`  ${member.user ? `${member.user.name} (${member.user.id})` : "(deleted user)"}`);

    if (dryRun) {
      console.log("Dry run: nothing changed.");
      process.exit(0);
    }

    await models.InGroup.deleteMany({ group: group._id });
    await models.Group.deleteOne({ _id: group._id });

    const redis = require("../modules/redis");
    for (const member of members)
      if (member.user) await redis.cacheUserPermissions(member.user.id);

    console.log("Removed the Dev group and its memberships.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
