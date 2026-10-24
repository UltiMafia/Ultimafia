/**
 * Seed the SetupArchivistBot system account.
 *
 * Idempotent. A user with SETUP_ARCHIVIST_BOT_ID is left in place and
 * forced onto the system-account shape (no email, discordId, or fbUid).
 *
 * Run:
 *   node migrations/seedSetupArchivistBot.js
 *
 * Requires .env with MONGO_URL / MONGO_DB / MONGO_USER / MONGO_PW.
 */

require("dotenv").config();
const models = require("../db/models");
const constants = require("../data/constants");

const BOT_ID = constants.SETUP_ARCHIVIST_BOT_ID;
const BOT_NAME = constants.SETUP_ARCHIVIST_BOT_NAME;
const BOT_BIO =
  "System account holding setups from deleted accounts. Not playable.";

async function migrate() {
  const existing = await models.User.findOne({ id: BOT_ID }).select(
    "_id name systemAccount"
  );

  if (existing) {
    await models.User.updateOne(
      { id: BOT_ID },
      {
        $set: {
          name: BOT_NAME,
          bio: BOT_BIO,
          systemAccount: true,
          deleted: false,
          banned: false,
        },
        $unset: {
          email: "",
          discordId: "",
          fbUid: "",
          discordUsername: "",
          discordName: "",
        },
      }
    ).exec();
    console.log(
      `SetupArchivistBot already exists (${existing._id}). Ensured system-account fields.`
    );
    return { created: false, id: BOT_ID };
  }

  const nameTaken = await models.User.findOne({
    name: new RegExp(`^${BOT_NAME}$`, "i"),
  }).select("id name");
  if (nameTaken) {
    throw new Error(
      `Cannot seed SetupArchivistBot: name is already used by user ${nameTaken.id}`
    );
  }

  const user = new models.User({
    id: BOT_ID,
    name: BOT_NAME,
    bio: BOT_BIO,
    systemAccount: true,
    joined: Date.now(),
    lastActive: 0,
    deleted: false,
  });
  await user.save();
  console.log(`Created SetupArchivistBot ${user._id} (${BOT_ID}).`);
  return { created: true, id: BOT_ID };
}

if (require.main === module) {
  const db = require("../db/db");

  db.promise
    .then(() => migrate())
    .then((result) => {
      console.log("Migration complete.", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = migrate;
