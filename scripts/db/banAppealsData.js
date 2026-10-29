// Shared helpers for the ban page / ban appeal backup, rollback and restore
// scripts.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = mongoose.mongo.BSON;

// Ban fields this feature adds.
const banQuery = {
  $or: [
    { reason: { $exists: true } },
    { createdAt: { $exists: true } },
    { scope: { $exists: true } },
    { reportIds: { $exists: true } },
  ],
};
const banProjection = {
  _id: 0,
  id: 1,
  userId: 1,
  type: 1,
  reason: 1,
  createdAt: 1,
  scope: 1,
  reportIds: 1,
};
// A site-banned user's restricted ban page session, with no normal sign-in.
const banSessionQuery = {
  "session.siteBan": { $exists: true },
  "session.user": { $exists: false },
};

// Appeal messages posted by the site sender (modules/siteSender.js). Code
// without that module can't load a channel holding them.
const siteMessageQuery = { senderId: "site:ban-appeals" };

// The admins' "Ban Appeals" conversation: its own fixed id (md5 of
// "site:ban-appeals", modules/banAppeals.js APPEAL_CHANNEL_ID), with the
// members' opens and unread chat notifications.
const appealChannelId = require("md5")("site:ban-appeals");
const appealChannelQuery = { id: appealChannelId };
const appealChannelOpenQuery = { channelId: appealChannelId };
const appealChannelNotifQuery = { channelId: appealChannelId, isChat: true };

function collection(name) {
  return mongoose.connection.db.collection(name);
}

function writeJson(dir, name, docs) {
  fs.writeFileSync(
    path.join(dir, `${name}.json`),
    EJSON.stringify(docs, null, 2, { relaxed: false }),
    { mode: 0o600 },
  );
}

function readJson(dir, name) {
  const file = path.join(dir, `${name}.json`);
  return fs.existsSync(file)
    ? EJSON.parse(fs.readFileSync(file, "utf8"))
    : null;
}

module.exports = {
  banQuery,
  banProjection,
  banSessionQuery,
  siteMessageQuery,
  appealChannelId,
  appealChannelQuery,
  appealChannelOpenQuery,
  appealChannelNotifQuery,
  collection,
  writeJson,
  readJson,
};
