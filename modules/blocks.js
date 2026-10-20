// User blocks.
//
// Blocking someone (User.blockedUsers) stops communication both ways at once:
// no DMs and no comments on each other's profile. Each block also files a
// BlockRequest. Only when staff approve it are the two kept out of each
// other's games, again both ways. Unblocking removes the block and its
// request, approved or not.
const shortid = require("shortid");
const models = require("../db/models");
const redis = require("./redis");

async function blockedListOf(userId, cache) {
  if (cache && cache.has(userId)) return cache.get(userId);
  const list = (await redis.getBlockedUsers(userId)) || [];
  if (cache) cache.set(userId, list);
  return list;
}

// True if either user has blocked the other (communication block).
async function usersBlockEachOther(userId, otherId, cache) {
  if (!userId || !otherId || userId == otherId) return false;
  const [mine, theirs] = await Promise.all([
    blockedListOf(userId, cache),
    blockedListOf(otherId, cache),
  ]);
  return mine.includes(otherId) || theirs.includes(userId);
}

async function recordBlockRequest(blockerId, blockedId) {
  await models.BlockRequest.updateOne(
    { blockerId, blockedId },
    {
      $setOnInsert: {
        id: shortid.generate(),
        blockerId,
        blockedId,
        date: Date.now(),
        status: "pending",
      },
    },
    { upsert: true }
  ).exec();
}

async function removeBlockRequest(blockerId, blockedId) {
  await models.BlockRequest.deleteOne({ blockerId, blockedId }).exec();
}

// Ids of everyone the user has an approved game block with, either way.
async function gameBlockedIds(userId) {
  if (!userId) return new Set();
  const rows = await models.BlockRequest.find({
    status: "approved",
    $or: [{ blockerId: userId }, { blockedId: userId }],
  })
    .select("blockerId blockedId -_id")
    .lean();

  const ids = new Set();
  for (const row of rows) {
    ids.add(row.blockerId == userId ? row.blockedId : row.blockerId);
  }
  return ids;
}

// True if the user has an approved game block with any of otherIds.
async function gameBlockedWithAny(userId, otherIds) {
  const others = [...new Set((otherIds || []).filter(Boolean))].filter(
    (id) => id != userId
  );
  if (!userId || others.length == 0) return false;

  const row = await models.BlockRequest.findOne({
    status: "approved",
    $or: [
      { blockerId: userId, blockedId: { $in: others } },
      { blockedId: userId, blockerId: { $in: others } },
    ],
  })
    .select("_id")
    .lean();
  return !!row;
}

// Requests where the user is the blocker or the blocked, newest first, with
// both names for the staff panel.
async function requestsInvolving(userId) {
  const rows = await models.BlockRequest.find({
    $or: [{ blockerId: userId }, { blockedId: userId }],
  })
    .sort({ date: -1 })
    .lean();

  const ids = new Set();
  for (const row of rows) {
    ids.add(row.blockerId);
    ids.add(row.blockedId);
    if (row.approvedBy) ids.add(row.approvedBy);
  }
  const users = await models.User.find({ id: { $in: [...ids] } })
    .select("id name avatar -_id")
    .lean();
  const byId = new Map(users.map((u) => [u.id, u]));
  const person = (id) => byId.get(id) || { id, name: `[not found: ${id}]` };

  return rows.map((row) => ({
    id: row.id,
    blocker: person(row.blockerId),
    blocked: person(row.blockedId),
    date: row.date,
    status: row.status,
    legacy: !!row.legacy,
    approvedBy: row.approvedBy ? person(row.approvedBy) : null,
    approvedAt: row.approvedAt || null,
  }));
}

// Returns { request } on success or { error, status } for the route.
async function approveRequest(requestId, modId) {
  const request = await models.BlockRequest.findOne({ id: requestId }).lean();
  if (!request) return { status: 404, error: "Block request not found." };
  if (request.status == "approved") {
    return { status: 409, error: "This block request is already approved." };
  }

  // The request goes with the block; a stale one must not be approved.
  const blocker = await models.User.findOne({ id: request.blockerId })
    .select("blockedUsers")
    .lean();
  if (!blocker || !(blocker.blockedUsers || []).includes(request.blockedId)) {
    await removeBlockRequest(request.blockerId, request.blockedId);
    return { status: 409, error: "This block was removed by the user." };
  }

  const now = Date.now();
  const updated = await models.BlockRequest.findOneAndUpdate(
    { id: requestId, status: "pending" },
    { $set: { status: "approved", approvedBy: modId, approvedAt: now } },
    { new: true }
  ).lean();
  if (!updated) {
    return { status: 409, error: "This block request is already approved." };
  }
  return { request: updated };
}

// Why a DM from senderId to member must be refused, or null. Works both
// ways: the member blocked the sender, or the sender blocked the member.
function dmBlockMessage(senderId, senderBlockedUsers, member) {
  if ((member.blockedUsers || []).indexOf(senderId) != -1) {
    return "Unable to send message, a member of this DM has blocked you.";
  }
  if ((senderBlockedUsers || []).indexOf(member.id) != -1) {
    return "You cannot send a message to someone you have blocked.";
  }
  return null;
}

module.exports = {
  dmBlockMessage,
  usersBlockEachOther,
  recordBlockRequest,
  removeBlockRequest,
  gameBlockedIds,
  gameBlockedWithAny,
  requestsInvolving,
  approveRequest,
};
