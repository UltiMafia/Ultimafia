// Site-ban page and the one appeal a site-banned user may file from it.
//
// A site-banned user who signs in gets a restricted session
// (req.session.siteBan) instead of a normal one (req.session.user). Only the
// ban page endpoints read it, so every other endpoint still treats the user as
// signed out. The appeal goes into a group DM with every admin, sent as the
// banned user, in the format staff asked for.
const shortid = require("shortid");
const md5 = require("md5");
const models = require("../db/models");
const routeUtils = require("../routes/utils");

const MAX_BAN_REASON_LENGTH = 300;
const MAX_APPEAL_LENGTH = 1000;
const MIN_APPEAL_LENGTH = 10;

// Members of these groups receive appeals and vote on them.
const APPEAL_RECIPIENT_GROUPS = ["Owner", "Admin"];

// Votes needed to decide an appeal: ACCEPTED at this many accept votes,
// DENIED at this many deny votes. Change here to change the rule.
const APPEAL_VOTES_REQUIRED = { accept: 2, deny: 2 };

const VOTES = ["accept", "deny"];

const STATUS = {
  NOT_SUBMITTED: "not_submitted",
  PENDING: "pending",
  ACCEPTED: "accepted",
  DENIED: "denied",
};

class AppealError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function cleanText(value) {
  if (value == null) return "";
  return String(value).replace(/\r\n?/g, "\n").trim();
}

// Returns the cleaned reason, or null when it is missing or too long.
function normalizeBanReason(value) {
  const reason = cleanText(value);
  if (!reason || reason.length > MAX_BAN_REASON_LENGTH) return null;
  return reason;
}

function formatAppealMessage({ username, reason, appeal }) {
  return `BAN-APPEAL: ${username} - BAN REASON: ${reason} , APPEAL: ${appeal}`;
}

// Same id scheme as modules/chat.js, so the channel is the group DM the chat
// panel would open for these members.
function userIdsToChannelId(userIds) {
  return md5([...userIds].sort().join(","));
}

function activeSiteBanQuery(userId, now = Date.now()) {
  return {
    userId,
    type: "site",
    $or: [{ expires: 0 }, { expires: { $gt: now } }],
  };
}

async function findActiveSiteBan(userId) {
  return models.Ban.findOne(activeSiteBanQuery(userId))
    .sort({ _id: -1 })
    .select("id userId modId expires reason createdAt auto _id");
}

function banIssuedAt(ban) {
  if (ban.createdAt) return ban.createdAt;
  if (ban._id && ban._id.getTimestamp) return ban._id.getTimestamp().getTime();
  return null;
}

function displayReason(ban) {
  return ban.reason || "No reason was recorded for this ban.";
}

async function getAdminIds() {
  const groups = await models.Group.find({
    name: { $in: APPEAL_RECIPIENT_GROUPS },
  }).select("_id");
  if (groups.length === 0) return [];
  const inGroups = await models.InGroup.find({
    group: { $in: groups.map((group) => group._id) },
  }).select("user");
  const users = await models.User.find({
    _id: { $in: inGroups.map((inGroup) => inGroup.user) },
    deleted: false,
  }).select("id");
  return [...new Set(users.map((user) => user.id))].sort();
}

function appealView(appeal) {
  if (!appeal) return { status: STATUS.NOT_SUBMITTED };
  return {
    status: appeal.status,
    text: appeal.text,
    submittedAt: appeal.createdAt,
    reviewedAt: appeal.reviewedAt || null,
  };
}

// What the ban page shows. Null when the user has no active site ban.
async function getBanPageInfo(userId) {
  const ban = await findActiveSiteBan(userId);
  if (!ban) return null;
  const [user, appeal] = await Promise.all([
    models.User.findOne({ id: userId }).select("id name"),
    models.SiteBanAppeal.findOne({ banId: ban.id }),
  ]);
  return {
    banned: true,
    username: user ? user.name : null,
    reason: displayReason(ban),
    issuedAt: banIssuedAt(ban),
    expires: ban.expires || 0,
    permanent: !ban.expires,
    appealLimit: 1,
    votesRequired: APPEAL_VOTES_REQUIRED.accept,
    appeal: appealView(appeal),
  };
}

// Writes the appeal into the admins' group DM. The chat server reads channels
// and messages from Mongo, so admins see it in their DM list the next time the
// chat panel loads, plus an unread chat notification.
async function sendAppealMessage({ senderId, recipientIds, content }) {
  const memberIds = [...new Set([senderId, ...recipientIds])];
  const channelId = userIdsToChannelId(memberIds);
  const now = Date.now();

  await models.ChatChannel.updateOne(
    { id: channelId },
    {
      $setOnInsert: { id: channelId, public: false, memberIds },
      $set: { lastMessageDate: now },
    },
    { upsert: true },
  ).exec();

  await new models.ChatMessage({
    id: shortid.generate(),
    senderId,
    date: now,
    channel: channelId,
    content,
  }).save();

  for (const recipientId of recipientIds) {
    await models.ChannelOpen.updateOne(
      { user: recipientId, channelId },
      { $setOnInsert: { user: recipientId, channelId } },
      { upsert: true },
    ).exec();
  }

  await routeUtils.createNotification(
    { channel: channelId, isChat: true },
    recipientIds,
  );

  return channelId;
}

async function submitAppeal(userId, rawText) {
  const text = cleanText(rawText);
  if (text.length < MIN_APPEAL_LENGTH)
    throw new AppealError(
      400,
      `Your appeal must be at least ${MIN_APPEAL_LENGTH} characters.`,
    );
  if (text.length > MAX_APPEAL_LENGTH)
    throw new AppealError(
      400,
      `Your appeal can be at most ${MAX_APPEAL_LENGTH} characters.`,
    );

  const ban = await findActiveSiteBan(userId);
  if (!ban) throw new AppealError(404, "You are not site-banned.");

  const user = await models.User.findOne({ id: userId }).select("id name");
  if (!user) throw new AppealError(404, "User not found.");

  const recipientIds = (await getAdminIds()).filter((id) => id !== userId);
  if (recipientIds.length === 0)
    throw new AppealError(503, "Appeals cannot be sent right now.");

  await models.SiteBanAppeal.init();
  if (await models.SiteBanAppeal.exists({ banId: ban.id }))
    throw new AppealError(409, "You have already appealed this ban.");

  const reason = displayReason(ban);
  const appeal = new models.SiteBanAppeal({
    id: shortid.generate(),
    banId: ban.id,
    userId,
    banModId: ban.modId,
    banReason: reason,
    text,
    status: STATUS.PENDING,
    recipientIds,
    createdAt: Date.now(),
  });

  // The unique banId index is the one-appeal rule: a second insert for the
  // same ban fails here, even if two requests race.
  try {
    await appeal.save();
  } catch (e) {
    if (e && e.code === 11000)
      throw new AppealError(409, "You have already appealed this ban.");
    throw e;
  }

  try {
    const content = formatAppealMessage({
      username: user.name,
      reason,
      appeal: text,
    });
    appeal.channelId = await sendAppealMessage({
      senderId: userId,
      recipientIds,
      content,
    });
    await appeal.save();
  } catch (e) {
    // Nobody got it: let the user try again.
    await models.SiteBanAppeal.deleteOne({ id: appeal.id }).exec();
    throw e;
  }

  return appealView(appeal);
}

function tallyVotes(votes) {
  const tally = { accept: 0, deny: 0, required: { ...APPEAL_VOTES_REQUIRED } };
  for (const vote of votes || [])
    if (VOTES.includes(vote.vote)) tally[vote.vote]++;
  return tally;
}

function decidedStatus(tally) {
  if (tally.accept >= APPEAL_VOTES_REQUIRED.accept) return STATUS.ACCEPTED;
  if (tally.deny >= APPEAL_VOTES_REQUIRED.deny) return STATUS.DENIED;
  return STATUS.PENDING;
}

function formatVoteMessage({ voterName, vote, tally, status }) {
  const result =
    status === STATUS.PENDING
      ? "still PENDING"
      : `appeal ${status.toUpperCase()}`;
  return `BAN-APPEAL VOTE: ${voterName} voted ${vote.toUpperCase()} - accept ${tally.accept}/${tally.required.accept}, deny ${tally.deny}/${tally.required.deny} - ${result}`;
}

async function findLatestAppeal(userId) {
  return models.SiteBanAppeal.findOne({ userId }).sort({ createdAt: -1 });
}

// The appeal with its tally and voter names, for admins.
async function getAppealForAdmins(userId) {
  const appeal = await findLatestAppeal(userId);
  if (!appeal) throw new AppealError(404, "This user has no ban appeal.");
  const voters = await models.User.find({
    id: { $in: (appeal.votes || []).map((vote) => vote.voterId) },
  }).select("id name");
  const names = Object.fromEntries(voters.map((user) => [user.id, user.name]));
  return {
    id: appeal.id,
    userId: appeal.userId,
    status: appeal.status,
    banReason: appeal.banReason,
    text: appeal.text,
    createdAt: appeal.createdAt,
    tally: tallyVotes(appeal.votes),
    votes: (appeal.votes || []).map((vote) => ({
      voterId: vote.voterId,
      voterName: names[vote.voterId] || vote.voterId,
      vote: vote.vote,
      at: vote.at,
      notes: vote.notes || "",
    })),
  };
}

// An admin's vote on the user's pending appeal. Replaces that admin's earlier
// vote; the appeal is decided once a side reaches APPEAL_VOTES_REQUIRED.
// Deciding never unbans: lifting the ban is a separate site Unban.
async function voteOnAppeal({ modId, userId, vote, notes }) {
  if (!VOTES.includes(vote))
    throw new AppealError(400, "Vote must be accept or deny.");

  const appeal = await findLatestAppeal(userId);
  if (!appeal) throw new AppealError(404, "This user has no ban appeal.");
  if (appeal.status !== STATUS.PENDING)
    throw new AppealError(
      409,
      `This appeal is already ${appeal.status.toUpperCase()}; votes are closed.`,
    );

  const entry = {
    voterId: modId,
    vote,
    at: Date.now(),
    notes: cleanText(notes).slice(0, MAX_BAN_REASON_LENGTH),
  };
  // Replace this admin's vote: drop the old one, then add the new one, both
  // only while the appeal is pending.
  await models.SiteBanAppeal.updateOne(
    { id: appeal.id, status: STATUS.PENDING },
    { $pull: { votes: { voterId: modId } } },
  ).exec();
  const pushed = await models.SiteBanAppeal.updateOne(
    { id: appeal.id, status: STATUS.PENDING },
    { $push: { votes: entry } },
  ).exec();
  if (!pushed.modifiedCount)
    throw new AppealError(409, "This appeal was decided; votes are closed.");

  let current = await models.SiteBanAppeal.findOne({ id: appeal.id });
  let tally = tallyVotes(current.votes);
  const status = decidedStatus(tally);
  let decided = false;
  if (status !== STATUS.PENDING) {
    const updated = await models.SiteBanAppeal.findOneAndUpdate(
      { id: appeal.id, status: STATUS.PENDING },
      { $set: { status, reviewedBy: modId, reviewedAt: Date.now() } },
      { new: true },
    );
    if (updated) {
      current = updated;
      decided = true;
    } else {
      current = await models.SiteBanAppeal.findOne({ id: appeal.id });
    }
    tally = tallyVotes(current.votes);
  }

  // Show the tally to the admins in the appeal's group DM.
  if (current.channelId) {
    const voter = await models.User.findOne({ id: modId }).select("name");
    const content = formatVoteMessage({
      voterName: voter ? voter.name : modId,
      vote,
      tally,
      status: current.status,
    });
    await new models.ChatMessage({
      id: shortid.generate(),
      senderId: modId,
      date: Date.now(),
      channel: current.channelId,
      content,
    }).save();
    await models.ChatChannel.updateOne(
      { id: current.channelId },
      { $set: { lastMessageDate: Date.now() } },
    ).exec();
  }

  return { appeal: current, tally, status: current.status, decided };
}

module.exports = {
  STATUS,
  AppealError,
  APPEAL_RECIPIENT_GROUPS,
  APPEAL_VOTES_REQUIRED,
  MAX_BAN_REASON_LENGTH,
  MAX_APPEAL_LENGTH,
  MIN_APPEAL_LENGTH,
  normalizeBanReason,
  formatAppealMessage,
  userIdsToChannelId,
  findActiveSiteBan,
  getAdminIds,
  getBanPageInfo,
  submitAppeal,
  sendAppealMessage,
  tallyVotes,
  decidedStatus,
  formatVoteMessage,
  getAppealForAdmins,
  voteOnAppeal,
};
