const mongoose = require("mongoose");
const models = require("../db/models");
const constants = require("../data/constants");
const routeUtils = require("../routes/utils");
const redis = require("./redis");
const logger = require("./logging")(".");

const SETUP_ARCHIVIST_BOT_ID = constants.SETUP_ARCHIVIST_BOT_ID;
// Pre-#2766 archive account. Its remaining setups are curated and public.
const LEGACY_SETUP_ARCHIVIST_ID = "uBqs8KaDx";

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

// Bot-owned setups are manageable only with manageArchivedSetups.
// Every other setup keeps the action's existing owner / perm rules.
async function canManageSetup(userId, setup, action) {
  if (!userId) return false;

  const creatorId = setup ? await creatorPublicId(setup) : null;
  if (creatorId === SETUP_ARCHIVIST_BOT_ID) {
    return routeUtils.verifyPermission(userId, "manageArchivedSetups");
  }

  const isOwner = !!(creatorId && creatorId === userId);

  switch (action) {
    case "edit":
      if (!setup) return routeUtils.verifyPermission(userId, "editAnySetup");
      if (!creatorId || isOwner) return true;
      return routeUtils.verifyPermission(userId, "editAnySetup");
    case "description":
      return isOwner;
    case "delete":
      if (isOwner) return true;
      return routeUtils.verifyPermission(userId, "deleteSetup");
    case "unarchive":
      if (isOwner) return true;
      return isAdminPlus(userId);
    case "restore":
      return routeUtils.verifyPermission(userId, "restoreSetup");
    case "feature":
      return routeUtils.verifyPermission(userId, "featureSetup");
    case "ranked":
      return routeUtils.verifyPermission(userId, "approveRanked");
    case "competitive":
      return routeUtils.verifyPermission(userId, "approveCompetitive");
    case "archive":
      return routeUtils.verifyPermission(userId, "archiveSetup");
    case "clearName":
    case "clearDescription":
      return routeUtils.verifyPermission(userId, "clearSetupName");
    default:
      return false;
  }
}

async function isBotOwned(setup) {
  if (!setup) return false;
  return (await creatorPublicId(setup)) === SETUP_ARCHIVIST_BOT_ID;
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
async function transferToArchiveAccount(setup, by, reason, opts) {
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
  // #2706 rows have no known original creator. Leave the field unset.
  if (!setup.originalCreator && !(opts && opts.leaveOriginalCreatorNull)) {
    set.originalCreator = fromId;
  }

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

const FEATURED_SETUP_CACHE_KEYS = [
  "game:featuredSetup:classic",
  "game:featuredSetup:main",
  "game:featuredSetup:minigames",
];

function originalCreatorId(setup) {
  const value = setup && setup.originalCreator;
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id;
  return value;
}

function creatorInfo(setup) {
  const creator = setup && setup.creator;
  if (!creator) return { id: null, oid: null, deleted: false, bot: false };
  if (typeof creator === "object" && (creator.id || creator._id)) {
    const id = typeof creator.id === "string" ? creator.id : null;
    return {
      id,
      oid: creator._id || null,
      deleted: !!creator.deleted,
      bot: id === SETUP_ARCHIVIST_BOT_ID || !!creator.systemAccount,
    };
  }
  return { id: null, oid: creator, deleted: false, bot: false };
}

// ownerDeleted archives, setups still on a deleted user, and bot-owned
// setups that recorded an originalCreator (including a stale transfer).
function classifyForRestore(setup, target) {
  if (!setup) return { status: "skip", reason: "missing" };

  const info = creatorInfo(setup);
  const targetOid = target && target._id;
  const ownedByTarget =
    (info.oid && targetOid && String(info.oid) === String(targetOid)) ||
    (info.id && target && info.id === target.id);
  if (ownedByTarget) return { status: "already", reason: "alreadyTarget" };

  const liveOwner = info.oid && !info.deleted && !info.bot;
  if (liveOwner) return { status: "skip", reason: "liveOwner" };

  // A stale transfer is bot-owned, archived, and still remembers who owned it.
  // #2706 rows have no originalCreator; archivedReason ownerDeleted covers them.
  const fromDeletedAccount =
    info.bot && !!originalCreatorId(setup) && setup.archived === true;
  if (
    setup.archivedReason === "ownerDeleted" ||
    info.deleted ||
    fromDeletedAccount
  ) {
    return { status: "restore" };
  }
  return { status: "skip", reason: "ineligible" };
}

async function loadRestoreRequest(body) {
  const source = body || {};
  const toUserId = source.toUserId ? String(source.toUserId) : "";
  const fromUserId = source.fromUserId ? String(source.fromUserId) : "";
  const setupIds = Array.isArray(source.setupIds)
    ? source.setupIds.map((id) => String(id)).filter(Boolean)
    : [];
  const blockers = [];

  if (!toUserId) blockers.push({ code: "targetMissing" });

  const target = toUserId
    ? await models.User.findOne({ id: toUserId })
        .select("_id id deleted banned setups systemAccount")
        .lean()
    : null;
  if (toUserId && !target) blockers.push({ code: "targetMissing" });
  else if (target && target.deleted) blockers.push({ code: "targetDeleted" });
  else if (target && target.banned) blockers.push({ code: "targetBanned" });
  else if (target && target.systemAccount) blockers.push({ code: "targetSystem" });

  let setups = [];
  if (setupIds.length) {
    const found = await models.Setup.find({ id: { $in: setupIds } })
      .select(
        "_id id name creator originalCreator archived archivedReason played favorites voteCount upVotes downVotes"
      )
      .populate("creator", "_id id deleted systemAccount")
      .populate("originalCreator", "_id id")
      .lean();
    const byId = new Map((found || []).map((setup) => [setup.id, setup]));
    for (const id of setupIds) {
      if (!byId.has(id)) blockers.push({ code: "setupMissing", id });
    }
    setups = setupIds.map((id) => byId.get(id)).filter(Boolean);
  } else if (fromUserId) {
    const fromUser = await models.User.findOne({ id: fromUserId })
      .select("_id id")
      .lean();
    if (!fromUser) {
      blockers.push({ code: "fromUserMissing" });
    } else {
      setups = await models.Setup.find({
        $or: [{ originalCreator: fromUser._id }, { creator: fromUser._id }],
      })
        .select(
          "_id id name creator originalCreator archived archivedReason played favorites voteCount upVotes downVotes"
        )
        .populate("creator", "_id id deleted systemAccount")
        .populate("originalCreator", "_id id")
        .lean();
    }
  } else if (toUserId) {
    blockers.push({ code: "missingSelection" });
  }

  return { target, setups: setups || [], blockers, toUserId, fromUserId, setupIds };
}

function addingCount(target, setups) {
  const owned = new Set((target.setups || []).map((id) => String(id)));
  let adding = 0;
  for (const setup of setups) {
    if (!owned.has(String(setup._id))) adding += 1;
  }
  return { owned: (target.setups || []).length, adding };
}

async function linkedCounts(setups) {
  if (!setups.length) return { guides: 0, games: 0, favorites: 0, votes: 0 };
  const ids = setups.map((setup) => setup._id);
  const publicIds = setups.map((setup) => setup.id);
  const [guides, games, favorites, votes] = await Promise.all([
    models.Strategy.countDocuments({ setup: { $in: ids } }),
    models.Game.countDocuments({ setup: { $in: ids } }),
    models.User.countDocuments({ favSetups: { $in: ids } }),
    models.ForumVote.countDocuments({ item: { $in: publicIds } }),
  ]);
  return { guides, games, favorites, votes };
}

const HARD_BLOCKERS = new Set([
  "targetMissing",
  "targetDeleted",
  "targetBanned",
  "targetSystem",
  "missingSelection",
  "fromUserMissing",
  "cap",
]);

async function planRestore(loaded, opts) {
  const blockers = (loaded.blockers || []).slice();
  const rows = [];
  const restoring = [];
  const targetOk = loaded.target && !blockers.some((item) => HARD_BLOCKERS.has(item.code));

  if (targetOk) {
    for (const setup of loaded.setups) {
      const row = classifyForRestore(setup, loaded.target);
      rows.push({
        id: setup.id,
        name: setup.name,
        status: row.status,
        reason: row.reason || null,
      });
      if (row.status === "restore") restoring.push(setup);
      if (
        row.status === "already" &&
        opts.unarchive !== false &&
        setup.archived
      ) {
        restoring.push(setup);
      }
    }
    const cap = addingCount(
      loaded.target,
      restoring.filter((setup) => classifyForRestore(setup, loaded.target).status === "restore")
    );
    if (cap.owned + cap.adding > constants.maxOwnedSetups) {
      blockers.push({
        code: "cap",
        owned: cap.owned,
        adding: cap.adding,
        max: constants.maxOwnedSetups,
      });
    }
  }

  const hardBlockers = blockers.filter((item) => HARD_BLOCKERS.has(item.code));
  // Counts stay visible on a dry run even when a hard blocker refuses the write.
  const counts = await linkedCounts(restoring);

  return {
    hardBlockers,
    restoring: hardBlockers.length ? [] : restoring,
    target: loaded.target,
    public: {
      toUserId: loaded.toUserId,
      fromUserId: loaded.fromUserId || null,
      unarchive: opts.unarchive !== false,
      reassignGuides: opts.reassignGuides === true,
      setups: rows,
      skipped: rows.filter((row) => row.status === "skip"),
      counts,
      blockers,
    },
  };
}

async function withOptionalTransaction(work) {
  const conn = mongoose.connection;
  if (!conn || conn.readyState !== 1 || !conn.db) return work(null);

  let replica = false;
  try {
    const hello = await conn.db.admin().command({ hello: 1 });
    replica = !!(hello && (hello.setName || hello.msg === "isdbgrid"));
  } catch (e) {
    replica = false;
  }
  if (!replica) return work(null);

  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (e) {
    logger.error(e);
    throw e;
  } finally {
    if (session) await session.endSession();
  }
}

async function applyOneRestore(setup, target, by, opts, session) {
  const fromId = creatorObjectId(setup);
  const targetId = target._id;
  const already = fromId && String(fromId) === String(targetId);
  const writeOpts = session ? { session } : undefined;

  if (!already) {
    if (fromId) {
      await models.User.updateOne(
        { _id: fromId },
        { $pull: { setups: setup._id } },
        writeOpts
      ).exec();
    }
    await models.User.updateOne(
      { _id: targetId },
      { $addToSet: { setups: setup._id } },
      writeOpts
    ).exec();

    const byRef = await resolveUserRef(by);
    const entry = {
      from: fromId,
      to: targetId,
      at: Date.now(),
      reason: "restore",
    };
    if (byRef) entry.by = byRef;

    await models.Setup.updateOne(
      { _id: setup._id },
      { $set: { creator: targetId }, $push: { ownershipHistory: entry } },
      writeOpts
    ).exec();
  }

  if (opts.unarchive !== false && setup.archived) {
    await models.Setup.updateOne(
      { _id: setup._id },
      {
        $set: { archived: false },
        $unset: { archivedAt: "", archivedBy: "", archivedReason: "" },
      },
      writeOpts
    ).exec();
  }

  if (opts.reassignGuides === true) {
    const authorId = originalCreatorId(setup);
    if (authorId) {
      await models.Strategy.updateMany(
        { setup: setup._id, author: authorId },
        { $set: { author: targetId } },
        writeOpts
      ).exec();
    }
  }

  return { id: setup.id, already: !!already };
}

async function applyRestore(plan, by, opts) {
  const restored = [];
  await withOptionalTransaction(async (session) => {
    for (const setup of plan.restoring) {
      if (!(await canManageSetup(by, setup, "restore"))) {
        restored.push({ id: setup.id, skipped: "forbidden" });
        continue;
      }
      restored.push(await applyOneRestore(setup, plan.target, by, opts, session));
    }
  });
  return { restored };
}

async function clearSetupListCaches() {
  if (!redis.client || typeof redis.client.delAsync !== "function") return;
  for (const key of FEATURED_SETUP_CACHE_KEYS) {
    try {
      await redis.client.delAsync(key);
    } catch (e) {
      logger.error(e);
    }
  }
}

async function isSiteOwner(userId) {
  if (!userId) return false;
  const user = await models.User.findOne({ id: userId, deleted: false })
    .select("_id")
    .lean();
  if (!user) return false;
  const group = await models.Group.findOne({ name: /^Owner$/i })
    .select("_id")
    .lean();
  if (!group) return false;
  const membership = await models.InGroup.findOne({
    user: user._id,
    group: group._id,
  })
    .select("_id")
    .lean();
  return Boolean(membership);
}

function hasActivityStamp(setup) {
  return [setup.lastPlayedAt, setup.updatedAt, setup.createdAt].some(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

async function planStaleArchive(now) {
  const at = now == null ? Date.now() : now;
  const candidates = await models.Setup.find({
    archived: { $ne: true },
    creator: { $exists: true },
  })
    .select(
      "id name played featured ranked competitive favorites lastPlayedAt updatedAt createdAt creator archived"
    )
    .populate("creator", "id deleted systemAccount")
    .lean();

  const matched = [];
  const exempt = {
    archivistOwned: [],
    featured: [],
    ranked: [],
    competitive: [],
    played: [],
    recent: [],
    noActivity: [],
  };

  for (const setup of candidates || []) {
    if (!setup || setup.archived === true) continue;
    // Never sweep setups held by SetupArchivist, SetupArchivistBot or any
    // other system account.
    const creator = setup.creator || {};
    if (
      creator.systemAccount ||
      creator.id === LEGACY_SETUP_ARCHIVIST_ID ||
      creator.id === SETUP_ARCHIVIST_BOT_ID
    ) {
      exempt.archivistOwned.push(setup.id);
      continue;
    }
    if (setup.featured) {
      exempt.featured.push(setup.id);
      continue;
    }
    if (setup.ranked) {
      exempt.ranked.push(setup.id);
      continue;
    }
    if (setup.competitive) {
      exempt.competitive.push(setup.id);
      continue;
    }
    const playedNum = Number(setup.played);
    const played = Number.isFinite(playedNum) ? playedNum : 0;
    if (played >= 30) {
      exempt.played.push(setup.id);
      continue;
    }
    if (isStale(setup, at)) {
      const creatorDeleted = !!(setup.creator && setup.creator.deleted);
      matched.push({
        id: setup.id,
        name: setup.name,
        played,
        favorites: setup.favorites || 0,
        creatorDeleted,
        transfer: creatorDeleted,
      });
      continue;
    }
    if (!hasActivityStamp(setup)) exempt.noActivity.push(setup.id);
    else exempt.recent.push(setup.id);
  }

  return {
    matched,
    exempt,
    count: matched.length,
    transfers: matched.filter((row) => row.transfer).map((row) => row.id),
  };
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
  canManageSetup,
  isBotOwned,
  archiveOwnedSetupsForDeletedUser,
  showArchivedRequested,
  archivedListFilter,
  applyArchivedFilter,
  isAdminPlus,
  loadRestoreRequest,
  planRestore,
  applyRestore,
  classifyForRestore,
  clearSetupListCaches,
  isSiteOwner,
  planStaleArchive,
};
