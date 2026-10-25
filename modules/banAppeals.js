// Site-ban page and the one appeal a site-banned user may file from it.
//
// A site-banned user who signs in gets a restricted session
// (req.session.siteBan) instead of a normal one (req.session.user). Only the
// ban page endpoints read it, so every other endpoint still treats the user as
// signed out. The appeal goes into a group DM of every admin (the banned user
// is not a member), posted by the site sender, in the format staff asked for.
// One appeal per person: an appeal from any account linked to this one (the
// mod "alts" links: a shared IP or device fingerprint) counts.
const shortid = require("shortid");
const md5 = require("md5");
const models = require("../db/models");
const routeUtils = require("../routes/utils");
const { SITE_SENDER_ID } = require("./siteSender");

const MAX_BAN_REASON_LENGTH = 300;
// The DM message is "BAN-APPEAL: <name> - BAN REASON: <reason> , APPEAL:
// <text>", so it is at most about 1,350 characters (username, 300-character
// reason, 1,000-character appeal). It is written server-side, so the
// 240-character limit on typed chat messages (modules/chat.js) doesn't cut it.
const MAX_APPEAL_LENGTH = 1000;
const MIN_APPEAL_LENGTH = 10;

// Members of these groups receive appeals and vote on them.
const APPEAL_RECIPIENT_GROUPS = ["Owner", "Admin"];

// Where the inbox notification goes: the mod panel, which has the "Ban Appeal
// Tally" and "Ban Appeal Vote" commands.
const APPEAL_NOTIFICATION_LINK = "/policy/moderation";

// Deciding an appeal. N is the number of admins the appeal was sent to
// (recipientIds, snapshotted at submission), D the deny votes, and
// acceptAt = min(ACCEPT_VOTES_REQUIRED, N):
// - ACCEPTED once there are acceptAt accept votes (checked first);
// - DENIED once D > N - acceptAt, i.e. the remaining admins can no longer
//   reach acceptAt accepts;
// - otherwise PENDING. With N = 0 nobody can vote, so it stays PENDING.
const ACCEPT_VOTES_REQUIRED = 2;

function acceptVotesNeeded(adminCount) {
  return Math.min(ACCEPT_VOTES_REQUIRED, adminCount);
}

function adminsLabel(count) {
  return `${count} admin${count === 1 ? "" : "s"}`;
}

const VOTES = ["accept", "deny"];

const STATUS = {
  NOT_SUBMITTED: "not_submitted",
  PENDING: "pending",
  ACCEPTED: "accepted",
  DENIED: "denied",
};

const LINKED_APPEAL_MESSAGE =
  "An appeal was already filed from an account linked to yours. Only one appeal is allowed per person.";

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

function appealView(appeal, { linked = false } = {}) {
  if (!appeal) return { status: STATUS.NOT_SUBMITTED };
  // An appeal filed from a linked account: show its status only. The link
  // could be a shared network, so its text and account stay private.
  if (linked)
    return {
      status: appeal.status,
      linkedAccount: true,
      submittedAt: appeal.createdAt,
    };
  return {
    status: appeal.status,
    text: appeal.text,
    submittedAt: appeal.createdAt,
    reviewedAt: appeal.reviewedAt || null,
  };
}

// The earliest appeal filed from an account linked to userId (the mod "alts"
// links) that counts against this ban: its ban is still an active site ban,
// or it was filed after this ban was issued. Older appeals, for bans that
// have since ended, don't block appealing a new ban.
async function findLinkedAppeal(userId, ban) {
  const linkedIds = (await routeUtils.getAltAccountIds(userId)).filter(
    (id) => id !== userId,
  );
  if (linkedIds.length === 0) return null;
  const appeals = await models.SiteBanAppeal.find({
    userId: { $in: linkedIds },
  }).sort({ createdAt: 1, id: 1 });
  if (appeals.length === 0) return null;
  const issuedAt = banIssuedAt(ban) || 0;
  const activeBanIds = new Set(
    (
      await models.Ban.find({
        id: { $in: appeals.map((appeal) => appeal.banId) },
        type: "site",
        $or: [{ expires: 0 }, { expires: { $gt: Date.now() } }],
      }).select("id")
    ).map((linkedBan) => linkedBan.id),
  );
  return (
    appeals.find(
      (appeal) =>
        activeBanIds.has(appeal.banId) || appeal.createdAt >= issuedAt,
    ) || null
  );
}

// This ban's appeal, or else a linked account's appeal that counts for it.
async function findAppealForBan(userId, ban) {
  const own = await models.SiteBanAppeal.findOne({ banId: ban.id });
  if (own) return { appeal: own, linked: false };
  const linked = await findLinkedAppeal(userId, ban);
  return linked ? { appeal: linked, linked: true } : null;
}

// What the ban page shows. Null when the user has no active site ban.
async function getBanPageInfo(userId) {
  const ban = await findActiveSiteBan(userId);
  if (!ban) return null;
  const [user, found] = await Promise.all([
    models.User.findOne({ id: userId }).select("id name"),
    findAppealForBan(userId, ban),
  ]);
  const adminCount = found
    ? (found.appeal.recipientIds || []).length
    : (await getAdminIds()).filter((id) => id !== userId).length;
  return {
    banned: true,
    username: user ? user.name : null,
    reason: displayReason(ban),
    issuedAt: banIssuedAt(ban),
    expires: ban.expires || 0,
    permanent: !ban.expires,
    appealLimit: 1,
    votesRequired: acceptVotesNeeded(adminCount),
    appeal: found
      ? appealView(found.appeal, { linked: found.linked })
      : appealView(null),
  };
}

// Writes the appeal into the admins' group DM, posted by the site sender, so
// the banned user is not a member and can't read the votes. The chat server
// reads channels and messages from Mongo, so admins see it in their DM list
// the next time the chat panel loads. Each admin also gets an unread chat
// notification and an inbox notification. There is no live push: the www
// process has no sockets to the chat server or the clients.
async function sendAppealMessage({ recipientIds, content, username }) {
  const memberIds = [...new Set(recipientIds)];
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
    senderId: SITE_SENDER_ID,
    date: now,
    channel: channelId,
    content,
  }).save();

  for (const recipientId of memberIds) {
    await models.ChannelOpen.updateOne(
      { user: recipientId, channelId },
      { $setOnInsert: { user: recipientId, channelId } },
      { upsert: true },
    ).exec();
  }

  await routeUtils.createNotification(
    { channel: channelId, isChat: true },
    memberIds,
  );
  await routeUtils.createNotification(
    {
      content: `Ban appeal pending: ${username}`,
      icon: "gavel",
      link: APPEAL_NOTIFICATION_LINK,
    },
    memberIds,
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

  await models.SiteBanAppeal.init();
  if (await models.SiteBanAppeal.exists({ banId: ban.id }))
    throw new AppealError(409, "You have already appealed this ban.");
  if (await findLinkedAppeal(userId, ban))
    throw new AppealError(409, LINKED_APPEAL_MESSAGE);

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

  // Two linked accounts can submit at the same moment. Both are saved by now,
  // so the later one (by createdAt, then id) sees the earlier and backs out.
  const earlier = await findLinkedAppeal(userId, ban);
  if (
    earlier &&
    (earlier.createdAt < appeal.createdAt ||
      (earlier.createdAt === appeal.createdAt && earlier.id < appeal.id))
  ) {
    await models.SiteBanAppeal.deleteOne({ id: appeal.id }).exec();
    throw new AppealError(409, LINKED_APPEAL_MESSAGE);
  }

  // With no admins (N = 0) nobody gets it: it stays PENDING.
  if (recipientIds.length === 0) return appealView(appeal);

  try {
    const content = formatAppealMessage({
      username: user.name,
      reason,
      appeal: text,
    });
    appeal.channelId = await sendAppealMessage({
      recipientIds,
      content,
      username: user.name,
    });
    await appeal.save();
  } catch (e) {
    // Nobody got it: let the user try again.
    await models.SiteBanAppeal.deleteOne({ id: appeal.id }).exec();
    throw e;
  }

  return appealView(appeal);
}

// N = admins the appeal went to; acceptAt / denyAt = accept / deny votes that
// decide it (both null when N = 0: nobody can vote).
function tallyVotes(votes, recipientIds) {
  const admins = (recipientIds || []).length;
  const eligible = new Set(recipientIds || []);
  const acceptAt = admins > 0 ? acceptVotesNeeded(admins) : null;
  const tally = {
    admins,
    accept: 0,
    deny: 0,
    acceptAt,
    denyAt: admins > 0 ? admins - acceptAt + 1 : null,
  };
  for (const vote of votes || [])
    if (VOTES.includes(vote.vote) && eligible.has(vote.voterId))
      tally[vote.vote]++;
  return tally;
}

function decidedStatus(tally) {
  if (!tally.admins) return STATUS.PENDING;
  if (tally.accept >= tally.acceptAt) return STATUS.ACCEPTED;
  if (tally.deny >= tally.denyAt) return STATUS.DENIED;
  return STATUS.PENDING;
}

function formatTally(tally) {
  if (!tally.admins) return "0 admins: nobody can vote";
  return `${adminsLabel(tally.admins)}: accept ${tally.accept}/${tally.acceptAt}, deny ${tally.deny}/${tally.denyAt}`;
}

function formatVoteMessage({ voterName, vote, tally, status }) {
  const result =
    status === STATUS.PENDING
      ? "still PENDING"
      : `appeal ${status.toUpperCase()}`;
  return `BAN-APPEAL VOTE: ${voterName} voted ${vote.toUpperCase()} - ${formatTally(tally)} - ${result}`;
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
    tally: tallyVotes(appeal.votes, appeal.recipientIds),
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
// vote; see ACCEPT_VOTES_REQUIRED for when the appeal is decided. Only the
// admins the appeal was sent to may vote.
// Deciding never unbans: lifting the ban is a separate site Unban.
async function voteOnAppeal({ modId, userId, vote, notes }) {
  if (!VOTES.includes(vote))
    throw new AppealError(400, "Vote must be accept or deny.");

  const appeal = await findLatestAppeal(userId);
  if (!appeal) throw new AppealError(404, "This user has no ban appeal.");
  if (!(appeal.recipientIds || []).includes(modId))
    throw new AppealError(
      403,
      "Only the admins this appeal was sent to can vote on it.",
    );
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
  let tally = tallyVotes(current.votes, current.recipientIds);
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
    tally = tallyVotes(current.votes, current.recipientIds);
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
  ACCEPT_VOTES_REQUIRED,
  acceptVotesNeeded,
  MAX_BAN_REASON_LENGTH,
  MAX_APPEAL_LENGTH,
  MIN_APPEAL_LENGTH,
  normalizeBanReason,
  formatAppealMessage,
  userIdsToChannelId,
  findActiveSiteBan,
  findLinkedAppeal,
  getAdminIds,
  getBanPageInfo,
  submitAppeal,
  sendAppealMessage,
  tallyVotes,
  decidedStatus,
  formatTally,
  formatVoteMessage,
  getAppealForAdmins,
  voteOnAppeal,
};
