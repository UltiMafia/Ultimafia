const models = require("../db/models");
const constants = require("../data/constants");
const routeUtils = require("../routes/utils");
const logger = require("./logging")(".");

const SETUP_ARCHIVIST_BOT_ID = constants.SETUP_ARCHIVIST_BOT_ID;

// Fixed windows so the stale thresholds do not depend on calendar length.
const DAY_MS = 24 * 60 * 60 * 1000;
const SIX_MONTHS_MS = 183 * DAY_MS;
const ONE_YEAR_MS = 365 * DAY_MS;

const ARCHIVE_REASONS = ["stale", "ownerDeleted", "manual"];

function isStale(setup, now) {
  if (!setup) return false;
  if (setup.featured || setup.ranked || setup.competitive) return false;

  const playedNum = Number(setup.played);
  const played = Number.isFinite(playedNum) ? playedNum : 0;
  if (played >= 30) return false;

  const activity = activityTime(setup);
  if (activity == null) return false;

  const at = now == null ? Date.now() : now;
  const idle = at - activity;
  if (played < 3) return idle >= SIX_MONTHS_MS;
  return idle >= ONE_YEAR_MS;
}

// lastPlayedAt, then updatedAt, then createdAt. No timestamp means not stale.
function activityTime(setup) {
  const raw = firstTimestamp(
    setup.lastPlayedAt,
    setup.updatedAt,
    setup.createdAt
  );
  if (raw == null) return null;
  const ms = raw instanceof Date ? raw.getTime() : Number(raw);
  return Number.isFinite(ms) ? ms : null;
}

function firstTimestamp(...values) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === undefined || value === null || value === "") continue;
    return value;
  }
  return null;
}

function showArchivedRequested(value) {
  return value === true || value === "true" || value === "1";
}

async function isAdminPlus(userId) {
  if (!userId) return false;
  return routeUtils.verifyPermission(
    userId,
    null,
    constants.defaultGroups.Admin.rank
  );
}

// Creator of a normal archived setup, or Admin+ . Bot-owned setups are Admin+ only.
async function canViewArchived(user, setup) {
  if (!setup || setup.archived !== true) return true;

  const userId =
    user == null ? null : typeof user === "string" ? user : user.id;
  if (!userId) return false;

  const creatorId = await creatorPublicId(setup);
  if (creatorId === SETUP_ARCHIVIST_BOT_ID) return isAdminPlus(userId);
  if (creatorId && creatorId === userId) return true;
  return isAdminPlus(userId);
}

async function creatorPublicId(setup) {
  const creator = setup && setup.creator;
  if (!creator) return null;
  if (typeof creator === "object" && typeof creator.id === "string") {
    return creator.id;
  }
  const oid =
    typeof creator === "object" && creator._id ? creator._id : creator;
  const doc = await models.User.findOne({ _id: oid }).select("id").lean();
  return doc ? doc.id : null;
}

// null: do not filter (Admin+ asked to see every archived setup).
// Otherwise a condition to AND into a public setup query.
async function archivedListFilter(userId, showArchived) {
  if (!showArchived) return { archived: { $ne: true } };
  if (await isAdminPlus(userId)) return null;
  if (!userId) return { archived: { $ne: true } };

  const user = await models.User.findOne({ id: userId }).select("_id").lean();
  if (!user) return { archived: { $ne: true } };

  return {
    $or: [
      { archived: { $ne: true } },
      { archived: true, creator: user._id },
    ],
  };
}

function applyArchivedFilter(query, filter) {
  if (!filter) return query;
  if (filter.$or) {
    if (!query.$and) query.$and = [];
    query.$and.push(filter);
    return query;
  }
  query.archived = filter.archived;
  return query;
}

async function archiveSetups(ids, reason, by) {
  if (!ARCHIVE_REASONS.includes(reason)) {
    throw new Error(`Invalid archive reason: ${reason}`);
  }

  const publicIds = [];
  const objectIds = [];
  for (const raw of ids || []) {
    if (raw == null) continue;
    if (typeof raw === "object" && raw.id) {
      publicIds.push(String(raw.id));
      continue;
    }
    const text = String(raw);
    if (/^[a-f0-9]{24}$/i.test(text)) objectIds.push(text);
    else publicIds.push(text);
  }

  const or = [];
  if (publicIds.length) or.push({ id: { $in: publicIds } });
  if (objectIds.length) or.push({ _id: { $in: objectIds } });
  if (!or.length) return { matched: 0 };

  const byRef = await resolveUserRef(by);
  const set = {
    archived: true,
    archivedAt: Date.now(),
    archivedReason: reason,
  };
  if (byRef) set.archivedBy = byRef;

  // Already-archived setups keep their original reason and timestamp.
  return models.Setup.updateMany(
    { $or: or, archived: { $ne: true } },
    { $set: set }
  ).exec();
}

async function unarchiveSetup(setup, by) {
  if (!setup) return;
  const query = setup.id ? { id: setup.id } : { _id: setup._id };
  await models.Setup.updateOne(query, {
    $set: { archived: false },
    $unset: { archivedAt: "", archivedBy: "", archivedReason: "" },
  }).exec();
  logger.info(
    `Unarchived setup ${setup.id || setup._id} by ${by || "unknown"}`
  );
}

// Moves the existing setup document. Never inserts a new setup.
async function transferToArchiveAccount(setup, by, reason) {
  if (!setup || !setup._id) {
    throw new Error("Setup is missing an _id");
  }

  const bot = await models.User.findOne({ id: SETUP_ARCHIVIST_BOT_ID })
    .select("_id id")
    .lean();
  if (!bot) {
    const err = new Error("SetupArchivistBot not found");
    err.code = "ARCHIVIST_MISSING";
    throw err;
  }

  const fromId = creatorObjectId(setup);
  if (!fromId) throw new Error("Setup has no creator");
  if (String(fromId) === String(bot._id)) {
    return { transferred: false, alreadyOwned: true };
  }

  const byRef = await resolveUserRef(by);
  const entry = {
    from: fromId,
    to: bot._id,
    at: Date.now(),
    reason: reason || "transfer",
  };
  if (byRef) entry.by = byRef;

  const set = { creator: bot._id };
  if (!setup.originalCreator) set.originalCreator = fromId;

  await models.Setup.updateOne({ _id: setup._id }, {
    $set: set,
    $push: { ownershipHistory: entry },
  }).exec();

  await models.User.updateOne(
    { _id: fromId },
    { $pull: { setups: setup._id } }
  ).exec();
  await models.User.updateOne(
    { _id: bot._id },
    { $addToSet: { setups: setup._id } }
  ).exec();

  return { transferred: true, originalCreator: set.originalCreator || setup.originalCreator };
}

async function archiveOwnedSetupsForDeletedUser(userId) {
  const user = await models.User.findOne({ id: userId })
    .select("_id setups")
    .lean();
  if (!user || !user.setups || user.setups.length === 0) return;

  const setups = await models.Setup.find({
    _id: { $in: user.setups },
    creator: { $exists: true },
  })
    .select("_id id creator originalCreator")
    .lean();

  for (let i = 0; i < setups.length; i++) {
    const setup = setups[i];
    try {
      await transferToArchiveAccount(setup, userId, "ownerDeleted");
      await archiveSetups([setup.id || setup._id], "ownerDeleted", userId);
    } catch (e) {
      logger.error(
        `Failed to archive setup ${setup && (setup.id || setup._id)} for deleted user ${userId}: ${
          e && e.message ? e.message : e
        }`
      );
    }
  }
}

function creatorObjectId(setup) {
  if (!setup || !setup.creator) return null;
  if (typeof setup.creator === "object" && setup.creator._id) {
    return setup.creator._id;
  }
  return setup.creator;
}

async function resolveUserRef(by) {
  if (!by) return null;
  if (typeof by === "object" && by._id && !by.id) return by._id;
  if (typeof by === "object" && by._id && typeof by.id === "string") {
    return by._id;
  }
  const text = typeof by === "object" && by.id ? String(by.id) : String(by);
  if (/^[a-f0-9]{24}$/i.test(text)) return text;
  const user = await models.User.findOne({ id: text }).select("_id").lean();
  return user ? user._id : null;
}

module.exports = {
  SETUP_ARCHIVIST_BOT_ID,
  SIX_MONTHS_MS,
  ONE_YEAR_MS,
  isStale,
  archiveSetups,
  unarchiveSetup,
  transferToArchiveAccount,
  canViewArchived,
  archiveOwnedSetupsForDeletedUser,
  showArchivedRequested,
  archivedListFilter,
  applyArchivedFilter,
  isAdminPlus,
};
