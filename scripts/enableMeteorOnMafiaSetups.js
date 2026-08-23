const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../db/db");
const models = require("../db/models");

async function main() {
  await db.promise;
  console.log("Connected to database.");

  const mustAct = await models.Setup.updateMany(
    {
      gameType: "Mafia",
      $or: [{ ForceMustAct: { $exists: false } }, { ForceMustAct: false }],
    },
    { $set: { ForceMustAct: true } }
  );

  const meteor = await models.Setup.updateMany(
    {
      gameType: "Mafia",
      $or: [
        { GameEndEvent: { $exists: false } },
        { GameEndEvent: null },
        { GameEndEvent: "" },
      ],
    },
    { $set: { GameEndEvent: "Meteor" } }
  );

  console.log(
    `ForceMustAct enabled on ${mustAct.modifiedCount || mustAct.nModified || 0} mafia setups.`
  );
  console.log(
    `GameEndEvent set to Meteor on ${meteor.modifiedCount || meteor.nModified || 0} mafia setups.`
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Error enabling meteor on mafia setups:", err);
  process.exit(1);
});
