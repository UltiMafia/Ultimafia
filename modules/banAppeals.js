// Site-ban page and the one appeal a site-banned user may file from it.
//
// A site-banned user who signs in gets a restricted session
// (req.session.siteBan) instead of a normal one (req.session.user). Only the
// ban page endpoints read it, so every other endpoint still treats the user as
// signed out. The appeal goes into a group DM of every admin (the banned user
// is not a member), posted by the site sender, in the format staff asked for.
// One appeal per person: an appeal from any account linked to this one (the
// mod "alts" links: a shared IP or device fingerprint) counts.
const crypto = require("crypto");
const shortid = require("shortid");
const md5 = require("md5");
const models = require("../db/models");
const logger = require("./logging")(".");
const routeUtils = require("../routes/utils");
const { SITE_SENDER_ID } = require("./siteSender");
const { parseUserIdList } = require("../lib/userIdList");

const MAX_BAN_REASON_LENGTH = 300;
// The DM message is "BAN-APPEAL: <name> - BAN REASON: <reason> , APPEAL:
// <text>", so it is at most about 1,350 characters (username, 300-character
// reason, 1,000-character appeal). It is written server-side, so the
// 240-character limit on typed chat messages (modules/chat.js) doesn't cut it.
const MAX_APPEAL_LENGTH = 1000;
const MIN_APPEAL_LENGTH = 10;

// The admins' appeal DM is shown under this name in the chat panel (the same
// name as the site sender in modules/siteSender.js).
const APPEAL_CHANNEL_NAME = "Ban Appeals";

// Members of these groups receive appeals and vote on them.
const APPEAL_RECIPIENT_GROUPS = ["Owner", "Admin"];

// BAN_APPEAL_VOTER_ALLOWLIST (server env, read once at startup): a
// comma-separated list of user ids. Unset or empty (only spaces and commas):
// every Owner and Admin gets appeals and votes, as on prod. Set: only the
// listed users who are also an Owner or Admin count toward N, get the appeal
// DM and notification, and can vote; nobody else is told about appeals. If
// none of them is an Owner or Admin, N = 0 and appeals stay PENDING. For
// dev/QA testing with test admin accounts only; leave it unset in production.
const parseVoterAllowlist = parseUserIdList;

const VOTER_ALLOWLIST = parseVoterAllowlist(
  process.env.BAN_APPEAL_VOTER_ALLOWLIST,
);

function voterAllowlistStartupWarning(allowlist = VOTER_ALLOWLIST) {
  return allowlist
    ? `BAN_APPEAL_VOTER_ALLOWLIST is set: ban appeals go only to ${allowlist.size} listed user id(s) who are Owner or Admin. Dev/QA only, never set this in production.`
    : null;
}

// The admin ids that receive appeals and vote on them: the Owner/Admin ids,
// narrowed to the allowlist when one is set.
function applyVoterAllowlist(adminIds, allowlist = VOTER_ALLOWLIST) {
  if (!allowlist) return adminIds;
  return adminIds.filter((id) => allowlist.has(id));
}

// The admins' Ban Appeals page and one appeal's case on it. The inbox
// notification and the DM vote messages link to the case.
const APPEALS_PAGE_PATH = "/policy/moderation/ban-appeals";
function appealCasePath(appealId) {
  return `${APPEALS_PAGE_PATH}/${appealId}`;
}

// Every vote needs a justification. Only eligible admins see it: it is never
// put in the DM, the public mod log, or anything the banned user can load.
const MAX_JUSTIFICATION_LENGTH = 1000;

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

// Ban types a moderator can issue, in the words the ban page uses. Other
// stored types (the automatic in-game restriction, IP flags, the ban for
// signing in to a banned account's email) are not shown.
const BAN_TYPE_LABELS = {
  site: "Site ban",
  forum: "Forum ban",
  chat: "Chat ban",
  game: "Game ban",
  playRanked: "Ranked ban",
  playCompetitive: "Competitive ban",
};
const BAN_TYPE_ORDER = Object.keys(BAN_TYPE_LABELS);

// Every active ban of a shown type, site bans first, then by type, then
// soonest to expire (permanent last).
async function findActiveBans(userId, now = Date.now()) {
  const bans = await models.Ban.find({
    userId,
    type: { $in: BAN_TYPE_ORDER },
    $or: [{ expires: 0 }, { expires: { $gt: now } }],
  }).select("type expires createdAt _id");
  const expiryRank = (ban) => (ban.expires ? ban.expires : Infinity);
  return bans.sort(
    (a, b) =>
      BAN_TYPE_ORDER.indexOf(a.type) - BAN_TYPE_ORDER.indexOf(b.type) ||
      expiryRank(a) - expiryRank(b),
  );
}

// What the banned user sees of a ban: its type and dates. Never the scope
// (single or linked accounts), the moderator or the ban id.
function banListView(ban) {
  return {
    type: ban.type,
    label: BAN_TYPE_LABELS[ban.type],
    issuedAt: banIssuedAt(ban),
    expires: ban.expires || 0,
    permanent: !ban.expires,
  };
}

// Signs these users out of every session and leaves each of those sessions a
// restricted ban-page session (the one a site-banned user gets on sign-in),
// so a tab that was open when the ban landed reloads into /banned instead of
// the login page. Nothing of the signed-in session is kept but its cookie
// settings. Any session still signed in afterwards is deleted.
//
// The session store (connect-mongo) keys each document by the express-session
// sid, a plain string, while the Session model declares the default ObjectId
// _id, so the documents are read and written through the native collection to
// keep Mongoose from casting the sid.
//
// Never throws: the ban has already been applied by the caller, so if the
// swap fails the error is logged and the users' sessions are deleted instead,
// as before ban-page sessions existed.
async function signOutToBanPage(userIds) {
  const ids = [...new Set((userIds || []).map(String))];
  if (ids.length === 0) return;
  try {
    const sessions = models.Session.collection;
    const docs = await sessions
      .find(
        { "session.user.id": { $in: ids } },
        { projection: { _id: 1, "session.cookie": 1, "session.user.id": 1 } },
      )
      .toArray();
    await Promise.all(
      docs.map((doc) =>
        sessions.updateOne(
          { _id: doc._id, "session.user.id": doc.session.user.id },
          {
            $set: {
              session: {
                cookie: doc.session.cookie,
                siteBan: {
                  userId: doc.session.user.id,
                  csrf: crypto.randomBytes(24).toString("hex"),
                },
              },
            },
          },
        ),
      ),
    );
  } catch (e) {
    logger.error(e);
  }
  try {
    await models.Session.collection.deleteMany({
      "session.user.id": { $in: ids },
    });
  } catch (e) {
    logger.error(e);
  }
}

function banIssuedAt(ban) {
  if (ban.createdAt) return ban.createdAt;
  if (ban._id && ban._id.getTimestamp) return ban._id.getTimestamp().getTime();
  return null;
}

function displayReason(ban) {
  return ban.reason || "No reason was recorded for this ban.";
}

// Every place that needs "the admins" for appeals (N on the ban page, the
// recipients snapshotted at submission, who may view and vote) uses this, so
// BAN_APPEAL_VOTER_ALLOWLIST applies everywhere.
async function getAdminIds(allowlist = VOTER_ALLOWLIST) {
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
  return applyVoterAllowlist(
    [...new Set(users.map((user) => user.id))].sort(),
    allowlist,
  );
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
  const [user, found, activeBans] = await Promise.all([
    models.User.findOne({ id: userId }).select("id name"),
    findAppealForBan(userId, ban),
    findActiveBans(userId),
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
    banType: "site",
    banTypeLabel: BAN_TYPE_LABELS.site,
    // Every active ban on the account (this site ban included).
    bans: activeBans.map(banListView),
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
async function sendAppealMessage({ recipientIds, content, username, link }) {
  const memberIds = [...new Set(recipientIds)];
  const channelId = userIdsToChannelId(memberIds);
  const now = Date.now();

  await models.ChatChannel.updateOne(
    { id: channelId },
    {
      $setOnInsert: { id: channelId, public: false, memberIds },
      // Named so the chat panel lists it as "Ban Appeals", not by the other
      // admins' names, which made it look like a DM from one of them.
      $set: { lastMessageDate: now, name: APPEAL_CHANNEL_NAME },
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
      link: link || APPEALS_PAGE_PATH,
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
      link: appealCasePath(appeal.id),
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

// "3 admins: accept 1 of 2 needed, deny 0 of 2 needed": votes so far
// against the votes that decide the appeal each way.
function formatTally(tally) {
  if (!tally.admins) return "0 admins: nobody can vote";
  return `${adminsLabel(tally.admins)}: accept ${tally.accept} of ${tally.acceptAt} needed, deny ${tally.deny} of ${tally.denyAt} needed`;
}

// The DM line for a vote. Never includes the justification; the case page
// shows it to the admins.
function formatVoteMessage({ voterName, vote, tally, status, appealId }) {
  const result =
    status === STATUS.PENDING
      ? "still PENDING"
      : `appeal ${status.toUpperCase()}`;
  const review = appealId ? ` - case: ${appealCasePath(appealId)}` : "";
  return `BAN-APPEAL VOTE: ${voterName} voted ${vote.toUpperCase()} - ${formatTally(tally)} - ${result}${review}`;
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
async function voteOnAppeal({ modId, userId, appealId, vote, notes }) {
  if (!VOTES.includes(vote))
    throw new AppealError(400, "Vote must be accept or deny.");
  const justification = cleanText(notes);
  if (!justification)
    throw new AppealError(400, "Give a justification with your vote.");
  if (justification.length > MAX_JUSTIFICATION_LENGTH)
    throw new AppealError(
      400,
      `The justification can be at most ${MAX_JUSTIFICATION_LENGTH} characters.`,
    );

  const appeal = appealId
    ? await models.SiteBanAppeal.findOne({ id: String(appealId) })
    : await findLatestAppeal(userId);
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
    notes: justification,
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

  // Show the tally to the admins in the appeal's group DM. Posted by the
  // site sender like the appeal itself; the message names the voter.
  if (current.channelId) {
    const voter = await models.User.findOne({ id: modId }).select("name");
    const content = formatVoteMessage({
      voterName: voter ? voter.name : modId,
      vote,
      tally,
      status: current.status,
      appealId: current.id,
    });
    await new models.ChatMessage({
      id: shortid.generate(),
      senderId: SITE_SENDER_ID,
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

// ---- Admin Ban Appeals page ----------------------------------------------

// Mod log names of the ban command / report ruling for each stored ban type.
const BAN_ACTION_NAMES = {
  site: "Site Ban",
  forum: "Forum Ban",
  chat: "Chat Ban",
  game: "Game Ban",
  playRanked: "Ranked Ban",
  playCompetitive: "Competitive Ban",
};
const BAN_SCOPE_LABELS = {
  linked: "All linked accounts",
  single: "This account only",
};
// For an older ban with no stored report link: reports against the user
// filed in this window before the ban (and up to an hour after).
const NEARBY_REPORT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LISTED_APPEALS = 200;

// Who may open the Ban Appeals page: the admins who get appeals
// (getAdminIds, narrowed by BAN_APPEAL_VOTER_ALLOWLIST).
async function isAppealAdmin(userId) {
  return !!userId && (await getAdminIds()).includes(userId);
}

async function namesById(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const users = await models.User.find({ id: { $in: unique } }).select(
    "id name",
  );
  return Object.fromEntries(users.map((user) => [user.id, user.name]));
}

function banSummary(ban) {
  if (!ban) return null;
  const now = Date.now();
  return {
    type: ban.type,
    label: BAN_TYPE_LABELS[ban.type] || ban.type,
    issuedAt: banIssuedAt(ban),
    expires: ban.expires || 0,
    permanent: !ban.expires,
    active: !ban.expires || ban.expires > now,
  };
}

// The list on the Ban Appeals page. filter: "pending" (default), "resolved"
// or "all". Pending appeals come first, newest first within each group.
async function listAppealsForAdmins({ filter = "pending", viewerId } = {}) {
  const query =
    filter === "resolved"
      ? { status: { $in: [STATUS.ACCEPTED, STATUS.DENIED] } }
      : filter === "all"
        ? {}
        : { status: STATUS.PENDING };
  const appeals = await models.SiteBanAppeal.find(query)
    .sort({ createdAt: -1 })
    .limit(MAX_LISTED_APPEALS);
  const [names, bans] = await Promise.all([
    namesById(appeals.map((appeal) => appeal.userId)),
    models.Ban.find({ id: { $in: appeals.map((appeal) => appeal.banId) } }),
  ]);
  const bansById = Object.fromEntries(bans.map((ban) => [ban.id, ban]));
  const rows = appeals.map((appeal) => {
    const mine = (appeal.votes || []).find((vote) => vote.voterId === viewerId);
    return {
      id: appeal.id,
      userId: appeal.userId,
      username: names[appeal.userId] || appeal.userId,
      ban: banSummary(bansById[appeal.banId]),
      filedAt: appeal.createdAt,
      status: appeal.status,
      tally: tallyVotes(appeal.votes, appeal.recipientIds),
      myVote: mine ? mine.vote : null,
      canVote:
        appeal.status === STATUS.PENDING &&
        (appeal.recipientIds || []).includes(viewerId),
    };
  });
  const pendingFirst = (row) => (row.status === STATUS.PENDING ? 0 : 1);
  return rows.sort(
    (a, b) => pendingFirst(a) - pendingFirst(b) || b.filedAt - a.filedAt,
  );
}

function reportView(report, linkedBy) {
  const ruling = report.finalRuling || {};
  return {
    id: report.id,
    linkedBy,
    reportedUserId: report.reportedUserId,
    rule: report.rule,
    description: report.description || "",
    gameId: report.gameId || null,
    reporterCount: (report.reporters || []).length || 1,
    status: report.status,
    createdAt: report.createdAt,
    completedAt: report.completedAt || null,
    completedBy: report.completedBy || null,
    ruling: ruling.violationName
      ? {
          violationName: ruling.violationName,
          banType: ruling.banType || null,
          banLength: ruling.banLength || null,
          notes: ruling.notes || "",
        }
      : ruling.notes
        ? { violationName: null, notes: ruling.notes }
        : null,
  };
}

// The report(s) that led to the ban, best link first:
// - "ban": report ids stored on the ban (bans from report rulings, from now on);
// - "report": the report's linkedBanId (the ruled-on user's own ban);
// - "violation": the violation ticket for this ban (also for linked accounts
//   banned by the same ruling) and the report with that violation;
// - "nearby": no stored link, so reports against the user filed in the 30
//   days before the ban.
async function findBanReports({ ban, banId, userId, aroundTime }) {
  if (ban && ban.reportIds && ban.reportIds.length) {
    const reports = await models.Report.find({ id: { $in: ban.reportIds } });
    if (reports.length) return reports.map((r) => reportView(r, "ban"));
  }
  if (banId) {
    const reports = await models.Report.find({ linkedBanId: banId });
    if (reports.length) return reports.map((r) => reportView(r, "report"));
    const ticket = await models.ViolationTicket.findOne({
      linkedBanId: banId,
    }).select("violationId");
    if (ticket && ticket.violationId) {
      const byViolation = await models.Report.find({
        "finalRuling.violationId": ticket.violationId,
      });
      if (byViolation.length)
        return byViolation.map((r) => reportView(r, "violation"));
    }
  }
  if (!aroundTime) return [];
  const nearby = await models.Report.find({
    reportedUserId: userId,
    createdAt: {
      $gte: aroundTime - NEARBY_REPORT_WINDOW_MS,
      $lte: aroundTime + 60 * 60 * 1000,
    },
  })
    .sort({ createdAt: -1 })
    .limit(20);
  return nearby.map((r) => reportView(r, "nearby"));
}

// The mod log entry that issued the ban: same moderator and type, within two
// minutes of the ban. Gives the scope and length text for older bans, and
// the account the ban was issued against (another account when this one was
// banned as a linked account).
async function findBanModAction(ban) {
  const at = banIssuedAt(ban);
  if (!at || !BAN_ACTION_NAMES[ban.type]) return null;
  return models.ModAction.findOne({
    name: BAN_ACTION_NAMES[ban.type],
    modId: ban.modId,
    date: { $gte: at - 2 * 60 * 1000, $lte: at + 2 * 60 * 1000 },
  }).sort({ date: 1 });
}

// One case on the Ban Appeals page, for an eligible admin.
async function getAppealCaseForAdmins(appealId, viewerId) {
  const appeal = await models.SiteBanAppeal.findOne({ id: String(appealId) });
  if (!appeal) throw new AppealError(404, "This appeal does not exist.");
  const ban = await models.Ban.findOne({ id: appeal.banId });
  const banAction = ban ? await findBanModAction(ban) : null;
  const issuedAt = ban ? banIssuedAt(ban) : null;

  const [reports, modActions] = await Promise.all([
    findBanReports({
      ban,
      banId: appeal.banId,
      userId: appeal.userId,
      aroundTime: issuedAt || appeal.createdAt,
    }),
    models.ModAction.find({ "args.0": appeal.userId })
      .sort({ date: -1 })
      .limit(50),
  ]);
  if (
    banAction &&
    !modActions.some((action) => action.id === banAction.id)
  )
    modActions.unshift(banAction);

  const bannedAs =
    banAction && banAction.args && banAction.args[0] !== appeal.userId
      ? banAction.args[0]
      : null;
  const names = await namesById([
    appeal.userId,
    ban && ban.modId,
    bannedAs,
    ...reports.map((r) => r.completedBy),
    ...reports.map((r) => r.reportedUserId),
    ...modActions.map((action) => action.modId),
    ...(appeal.votes || []).map((vote) => vote.voterId),
  ]);

  let scope = null;
  if (ban && ban.scope)
    scope = { value: ban.scope, label: BAN_SCOPE_LABELS[ban.scope] || ban.scope };
  else if (banAction && banAction.args && banAction.args[2])
    scope = { value: null, label: banAction.args[2] };
  else if (banAction) scope = { value: "linked", label: "All linked accounts" };

  const mine = (appeal.votes || []).find((vote) => vote.voterId === viewerId);
  return {
    id: appeal.id,
    userId: appeal.userId,
    username: names[appeal.userId] || appeal.userId,
    status: appeal.status,
    text: appeal.text,
    filedAt: appeal.createdAt,
    reviewedAt: appeal.reviewedAt || null,
    reviewedBy: appeal.reviewedBy
      ? { id: appeal.reviewedBy, name: names[appeal.reviewedBy] || appeal.reviewedBy }
      : null,
    channelId: appeal.channelId || null,
    ban: ban
      ? {
          id: ban.id,
          ...banSummary(ban),
          reason: displayReason(ban),
          scope,
          lengthText:
            (banAction && banAction.args && banAction.args[1]) || null,
          lengthMs: ban.expires && issuedAt ? ban.expires - issuedAt : null,
          bannedBy: ban.modId
            ? { id: ban.modId, name: names[ban.modId] || ban.modId }
            : null,
          bannedAs: bannedAs
            ? { id: bannedAs, name: names[bannedAs] || bannedAs }
            : null,
        }
      : { id: appeal.banId, removed: true, reason: appeal.banReason },
    reports: reports.map((report) => ({
      ...report,
      reportedUserName: names[report.reportedUserId] || report.reportedUserId,
      completedByName: report.completedBy
        ? names[report.completedBy] || report.completedBy
        : null,
    })),
    modActions: modActions.map((action) => ({
      id: action.id,
      name: action.name,
      args: action.args || [],
      date: action.date,
      modId: action.modId,
      modName: names[action.modId] || action.modId,
      issuedThisBan: !!banAction && action.id === banAction.id,
    })),
    tally: tallyVotes(appeal.votes, appeal.recipientIds),
    votes: (appeal.votes || []).map((vote) => ({
      voterId: vote.voterId,
      voterName: names[vote.voterId] || vote.voterId,
      vote: vote.vote,
      justification: vote.notes || "",
      at: vote.at,
    })),
    voters: (appeal.recipientIds || []).length,
    myVote: mine
      ? { vote: mine.vote, justification: mine.notes || "", at: mine.at }
      : null,
    canVote:
      appeal.status === STATUS.PENDING &&
      (appeal.recipientIds || []).includes(viewerId),
    maxJustificationLength: MAX_JUSTIFICATION_LENGTH,
  };
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
  BAN_TYPE_LABELS,
  findActiveSiteBan,
  findActiveBans,
  signOutToBanPage,
  findLinkedAppeal,
  getAdminIds,
  parseVoterAllowlist,
  applyVoterAllowlist,
  voterAllowlistStartupWarning,
  getBanPageInfo,
  submitAppeal,
  sendAppealMessage,
  tallyVotes,
  decidedStatus,
  formatTally,
  formatVoteMessage,
  getAppealForAdmins,
  voteOnAppeal,
  MAX_JUSTIFICATION_LENGTH,
  APPEALS_PAGE_PATH,
  appealCasePath,
  isAppealAdmin,
  listAppealsForAdmins,
  getAppealCaseForAdmins,
  findBanReports,
};
