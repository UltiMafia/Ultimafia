const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const models = require("../db/models");
const routeUtils = require("./utils");
const { getBasicUserInfo } = require("../modules/redis");
const logger = require("../modules/logging")(".");
const router = express.Router();

// Lightweight ETag fingerprint. Each endpoint samples one indexed "latest"
// lookup per source collection, hashes them together with the query params,
// and short-circuits with 304 when the client already has fresh data. The
// sample queries are cheap (single indexed findOne) so the fingerprint pays
// for itself by skipping the heavy aggregations and hydration downstream.
const latestId = (Model) =>
  Model.findOne({})
    .sort({ _id: -1 })
    .select("_id")
    .lean()
    .then((d) => (d ? String(d._id) : null));
const latestField = (Model, field) =>
  Model.findOne({})
    .sort({ [field]: -1 })
    .select(field)
    .lean()
    .then((d) => (d && d[field] != null ? String(d[field]) : null));

function makeEtag(obj) {
  const h = crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex");
  return `W/"${h.slice(0, 20)}"`;
}

function respondFresh(req, res, etag) {
  res.set("ETag", etag);
  res.set("Cache-Control", "private, no-cache");
  if (req.fresh) {
    res.status(304).end();
    return true;
  }
  return false;
}

const WINDOWS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function parseWindow(req) {
  const w = String(req.query.window || "24h");
  return WINDOWS[w] ? { key: w, ms: WINDOWS[w] } : { key: "24h", ms: WINDOWS["24h"] };
}

async function guard(req, res) {
  const userId = await routeUtils.verifyLoggedIn(req);
  if (!(await routeUtils.verifyPermission(res, userId, "viewSiteActivity")))
    return null;
  return userId;
}

// -----------------------------------------------------------------------------
// GET /summary — top-line counters
// -----------------------------------------------------------------------------
router.get("/summary", async function (req, res) {
  try {
    if (!(await guard(req, res))) return;

    const { key: windowKey, ms } = parseWindow(req);

    const [
      fpGame,
      fpUserJoined,
      fpComment,
      fpThread,
      fpSetupVer,
      fpReport,
      fpModAction,
      fpSiteAct,
    ] = await Promise.all([
      latestId(models.Game),
      latestField(models.User, "joined"),
      latestField(models.Comment, "date"),
      latestField(models.ForumThread, "postDate"),
      latestId(models.SetupVersion),
      latestField(models.Report, "createdAt"),
      latestField(models.ModAction, "date"),
      latestField(models.SiteActivity, "date"),
    ]);
    const etag = makeEtag({
      r: "summary",
      w: windowKey,
      fpGame,
      fpUserJoined,
      fpComment,
      fpThread,
      fpSetupVer,
      fpReport,
      fpModAction,
      fpSiteAct,
    });
    if (respondFresh(req, res, etag)) return;

    const now = Date.now();
    const cutoff = now - ms;
    const cutoffDate = new Date(cutoff);

    const [
      gamesHosted,
      dau,
      newSignups,
      commentsCreated,
      threadsCreated,
      setupsEdited,
      reportsFiled,
      modActionsTaken,
    ] = await Promise.all([
      models.Game.countDocuments({ startTime: { $gte: cutoff } }),
      // DAU is the classic "active since cutoff" — uses lastActive
      models.User.countDocuments({ lastActive: { $gte: cutoff } }),
      models.User.countDocuments({ joined: { $gte: cutoff } }),
      models.Comment.countDocuments({
        date: { $gte: cutoff },
        deleted: { $ne: true },
      }),
      models.ForumThread.countDocuments({
        postDate: { $gte: cutoff },
        deleted: { $ne: true },
      }),
      models.SetupVersion.countDocuments({ timestamp: { $gte: cutoffDate } }),
      models.Report.countDocuments({ createdAt: { $gte: cutoff } }),
      models.ModAction.countDocuments({ date: { $gte: cutoff } }),
    ]);

    res.status(200).send({
      gamesHosted,
      dau,
      newSignups,
      commentsCreated,
      threadsCreated,
      setupsEdited,
      reportsFiled,
      modActionsTaken,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error getting site activity summary.");
  }
});

// -----------------------------------------------------------------------------
// GET /games — chart data (ranked/unranked, game types, top setups)
// -----------------------------------------------------------------------------
router.get("/games", async function (req, res) {
  try {
    if (!(await guard(req, res))) return;

    const { key: windowKey, ms } = parseWindow(req);

    const fpGame = await latestId(models.Game);
    const etag = makeEtag({ r: "games", w: windowKey, fpGame });
    if (respondFresh(req, res, etag)) return;

    const cutoff = Date.now() - ms;

    const [mafiaAgg, typeAgg, topSetupsAgg] = await Promise.all([
      // Mafia games split into competitive / ranked / unranked. Competitive
      // takes precedence over ranked since a comp game is also ranked.
      models.Game.aggregate([
        { $match: { startTime: { $gte: cutoff }, type: "Mafia" } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$competitive", true] },
                "competitive",
                {
                  $cond: [
                    { $eq: ["$ranked", true] },
                    "ranked",
                    "unranked",
                  ],
                },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]),
      models.Game.aggregate([
        { $match: { startTime: { $gte: cutoff } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      models.Game.aggregate([
        { $match: { startTime: { $gte: cutoff } } },
        { $group: { _id: "$setup", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "setups",
            localField: "_id",
            foreignField: "_id",
            as: "setup",
          },
        },
        { $unwind: "$setup" },
        {
          $project: {
            _id: 0,
            setupId: "$setup.id",
            name: "$setup.name",
            count: 1,
          },
        },
      ]),
    ]);

    res.status(200).send({
      mafiaGames: mafiaAgg.map((r) => ({ label: r._id, count: r.count })),
      gameTypes: typeAgg.map((r) => ({ label: r._id || "Unknown", count: r.count })),
      topSetups: topSetupsAgg,
    });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error getting game activity.");
  }
});

// -----------------------------------------------------------------------------
// GET /feed — merged activity stream
// -----------------------------------------------------------------------------

// Helpers that each produce normalised { id, type, actorId, timestamp,
// targetType, targetId, targetLabel, contentPreview, link } rows. actorName +
// actorAvatar are hydrated after merge so we only hit Redis once per user.

function classifyCommentLocation(location) {
  if (!location) return { targetType: "profile", link: null };
  if (location.startsWith("role/"))
    return {
      targetType: "role",
      link: `/learn/role/${location.slice("role/".length)}`,
    };
  if (location.startsWith("setup/"))
    return {
      targetType: "setup",
      link: `/learn/setup/${location.slice("setup/".length)}`,
    };
  if (location.startsWith("family/"))
    return {
      targetType: "family",
      link: `/user/family/${location.slice("family/".length)}`,
    };
  if (location === "lobby" || location.startsWith("lobby-"))
    return { targetType: "lobby", link: `/play` };
  return { targetType: "profile", link: `/user/${location}` };
}

function truncate(str, n = 140) {
  if (!str) return "";
  const s = String(str);
  return s.length > n ? s.slice(0, n - 1) + "\u2026" : s;
}

async function fetchComments(cutoff, limit) {
  const rows = await models.Comment.find({
    date: { $gte: cutoff },
    deleted: { $ne: true },
  })
    .populate("author", "id")
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  // Collect ids that need name resolution in a single batch instead of
  // N queries per row.
  const setupIds = new Set();
  const profileIds = new Set();
  for (const r of rows) {
    const l = r.location;
    if (!l) continue;
    if (l.startsWith("setup/")) setupIds.add(l.slice("setup/".length));
    else if (
      !l.startsWith("role/") &&
      !l.startsWith("family/") &&
      l !== "lobby" &&
      !l.startsWith("lobby-")
    ) {
      profileIds.add(l);
    }
  }

  const [setupDocs, userDocs] = await Promise.all([
    setupIds.size
      ? models.Setup.find({ id: { $in: [...setupIds] } })
          .select("id name")
          .lean()
      : [],
    profileIds.size
      ? models.User.find({ id: { $in: [...profileIds] } })
          .select("id name")
          .lean()
      : [],
  ]);
  const setupNameById = Object.fromEntries(setupDocs.map((s) => [s.id, s.name]));
  const userNameById = Object.fromEntries(userDocs.map((u) => [u.id, u.name]));

  return rows.map((r) => {
    const loc = classifyCommentLocation(r.location);
    let targetLabel = r.location;
    if (r.location?.startsWith("role/")) {
      targetLabel = `Role: ${r.location.slice("role/".length)}`;
    } else if (r.location?.startsWith("setup/")) {
      const sid = r.location.slice("setup/".length);
      targetLabel = `Setup: ${setupNameById[sid] || sid}`;
    } else if (r.location?.startsWith("family/")) {
      targetLabel = `Family: ${r.location.slice("family/".length)}`;
    } else if (r.location === "lobby" || r.location?.startsWith("lobby-")) {
      targetLabel = "Lobby";
    } else if (r.location) {
      targetLabel = `Profile: ${userNameById[r.location] || r.location}`;
    }
    return {
      id: `comment:${r._id}`,
      type: "comment",
      category: "comments",
      actorId: r.author?.id,
      timestamp: r.date,
      targetType: loc.targetType,
      targetLabel,
      contentPreview: truncate(r.content),
      link: loc.link,
    };
  });
}

async function fetchForumThreads(cutoff, limit) {
  const rows = await models.ForumThread.find({
    postDate: { $gte: cutoff },
    deleted: { $ne: true },
  })
    .populate("author", "id")
    .sort({ postDate: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: `thread:${r._id}`,
    type: "thread",
    category: "forum",
    actorId: r.author?.id,
    timestamp: r.postDate,
    targetType: "thread",
    targetLabel: r.title,
    contentPreview: "",
    link: r.id ? `/community/forums/thread/${r.id}` : null,
  }));
}

async function fetchForumReplies(cutoff, limit) {
  const rows = await models.ForumReply.find({
    postDate: { $gte: cutoff },
    deleted: { $ne: true },
  })
    .populate("author", "id")
    .sort({ postDate: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: `reply:${r._id}`,
    type: "forumReply",
    category: "forum",
    actorId: r.author?.id,
    timestamp: r.postDate,
    targetType: "thread",
    targetLabel: null,
    contentPreview: truncate(r.content),
    link: null,
  }));
}

async function fetchSetupVersions(cutoff, limit) {
  const rows = await models.SetupVersion.find({
    timestamp: { $gte: new Date(cutoff) },
  })
    .populate({ path: "setup", select: "id name creator" })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  return rows
    .filter((r) => r.setup)
    .map((r) => ({
      id: `setupversion:${r._id}`,
      type: r.version === 1 ? "setupCreate" : "setupEdit",
      category: "setups",
      actorId: null, // creator is on Setup; resolved later if we need it
      setupCreatorObjectId: r.setup.creator,
      timestamp: new Date(r.timestamp).getTime(),
      targetType: "setup",
      targetLabel: r.setup.name,
      contentPreview: truncate(r.changelog || `v${r.version}`),
      link: `/learn/setup/${r.setup.id}`,
    }));
}

async function fetchPollVotes(cutoff, limit) {
  const rows = await models.PollVote.find({ votedAt: { $gte: cutoff } })
    .sort({ votedAt: -1 })
    .limit(limit)
    .lean();
  // Join polls in one shot so we can surface title + thread link.
  const pollIds = Array.from(new Set(rows.map((r) => r.pollId).filter(Boolean)));
  const polls = pollIds.length
    ? await models.Poll.find({ id: { $in: pollIds } })
        .select("id title question options threadId")
        .lean()
    : [];
  const pollsById = Object.fromEntries(polls.map((p) => [p.id, p]));
  return rows.map((r) => {
    const poll = pollsById[r.pollId];
    const optionText =
      poll && poll.options && poll.options[r.optionIndex] != null
        ? poll.options[r.optionIndex]
        : `option ${r.optionIndex}`;
    return {
      id: `pollvote:${r._id}`,
      type: "pollVote",
      category: "polls",
      actorId: r.userId,
      timestamp: r.votedAt,
      targetType: "poll",
      targetLabel: poll?.title || poll?.question || "a poll",
      contentPreview: optionText,
      link: poll?.threadId ? `/community/forums/thread/${poll.threadId}` : null,
    };
  });
}

async function fetchStampTrades(cutoff, limit) {
  const rows = await models.StampTrade.find({ updatedAt: { $gte: cutoff } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: `stamptrade:${r._id}`,
    type: "stampTrade",
    category: "profile",
    actorId: r.initiatorId,
    timestamp: r.updatedAt,
    targetType: "user",
    targetLabel: String(r.status || "").toLowerCase().replace(/_/g, " "),
    contentPreview: "",
    link: null,
  }));
}

async function fetchTrophies(cutoff, limit) {
  const rows = await models.Trophy.find({ createdAt: { $gte: cutoff } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: `trophy:${r._id}`,
    type: "trophyAward",
    category: "mod",
    actorId: r.createdBy,
    timestamp: r.createdAt,
    targetType: "user",
    targetUserId: r.ownerId,
    targetLabel: r.name || null,
    contentPreview: "",
    link: r.ownerId ? `/user/${r.ownerId}` : null,
  }));
}

async function fetchModActions(cutoff, limit) {
  const rows = await models.ModAction.find({ date: { $gte: cutoff } })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: `modaction:${r._id}`,
    type: "modAction",
    category: "mod",
    actorId: r.modId,
    timestamp: r.date,
    targetType: "modAction",
    targetLabel: r.name,
    contentPreview: truncate(
      [(r.args || []).join(" "), r.reason].filter(Boolean).join(" · ")
    ),
    link: null,
  }));
}

async function fetchReports(cutoff, limit) {
  const rows = await models.Report.find({ createdAt: { $gte: cutoff } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => ({
    id: `report:${r._id}`,
    type: "report",
    category: "mod",
    actorId: r.reporterId,
    timestamp: r.createdAt,
    targetType: "user",
    targetUserId: r.reportedUserId,
    targetLabel: r.status || null,
    contentPreview: "",
    link: `/policy/moderation/reports`,
  }));
}

async function fetchForumVotes(cutoff, limit) {
  // High-volume category. ForumVote has no explicit timestamp, so we use the
  // ObjectId generation time — built from the cutoff seconds.
  const cutoffHex = Math.floor(cutoff / 1000).toString(16).padStart(8, "0");
  const cutoffOid = mongoose.Types.ObjectId.createFromHexString(
    cutoffHex + "0000000000000000"
  );
  const rows = await models.ForumVote.find({ _id: { $gte: cutoffOid } })
    .sort({ _id: -1 })
    .limit(limit)
    .lean();

  // ForumVote.item is written by routes/votes.js as the target's custom `id`
  // shortid. Roles use a "<GameType>:<RoleName>" convention. Seed data may
  // also store raw ObjectId hex strings. Resolve each into a readable label
  // in a handful of batched lookups rather than N per-row queries.
  const shortIds = new Set();
  const objectIds = new Set();
  const OID_RE = /^[a-f0-9]{24}$/i;
  for (const r of rows) {
    if (!r.item) continue;
    if (r.item.includes(":")) continue; // role, resolved inline later
    if (OID_RE.test(r.item)) objectIds.add(r.item);
    else shortIds.add(r.item);
  }

  const shortIdList = [...shortIds];
  const objectIdList = [...objectIds]
    .map((s) => {
      try {
        return mongoose.Types.ObjectId.createFromHexString(s);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);

  const [
    setupDocs,
    threadDocs,
    replyDocs,
    commentDocs,
    strategyDocs,
    deckDocs,
    threadByOid,
    replyByOid,
    commentByOid,
    strategyByOid,
  ] = await Promise.all([
    shortIdList.length
      ? models.Setup.find({ id: { $in: shortIdList } })
          .select("id name")
          .lean()
      : [],
    shortIdList.length
      ? models.ForumThread.find({ id: { $in: shortIdList } })
          .select("id title")
          .lean()
      : [],
    shortIdList.length
      ? models.ForumReply.find({ id: { $in: shortIdList } })
          .select("id thread")
          .populate({ path: "thread", select: "id title" })
          .lean()
      : [],
    shortIdList.length
      ? models.Comment.find({ id: { $in: shortIdList } })
          .select("id location")
          .lean()
      : [],
    shortIdList.length
      ? models.Strategy.find({ id: { $in: shortIdList } })
          .select("id title")
          .lean()
      : [],
    shortIdList.length
      ? models.AnonymousDeck.find({ id: { $in: shortIdList } })
          .select("id name")
          .lean()
      : [],
    objectIdList.length
      ? models.ForumThread.find({ _id: { $in: objectIdList } })
          .select("_id id title")
          .lean()
      : [],
    objectIdList.length
      ? models.ForumReply.find({ _id: { $in: objectIdList } })
          .select("_id id thread")
          .populate({ path: "thread", select: "id title" })
          .lean()
      : [],
    objectIdList.length
      ? models.Comment.find({ _id: { $in: objectIdList } })
          .select("_id id location")
          .lean()
      : [],
    objectIdList.length
      ? models.Strategy.find({ _id: { $in: objectIdList } })
          .select("_id id title")
          .lean()
      : [],
  ]);

  // Resolved map: itemKey -> { label, link }
  const resolved = {};
  for (const s of setupDocs)
    resolved[s.id] = { label: `Setup: ${s.name}`, link: `/learn/setup/${s.id}` };
  for (const t of threadDocs)
    resolved[t.id] = {
      label: `Thread: ${t.title}`,
      link: `/community/forums/thread/${t.id}`,
    };
  for (const t of threadByOid)
    resolved[String(t._id)] = {
      label: `Thread: ${t.title}`,
      link: t.id ? `/community/forums/thread/${t.id}` : null,
    };
  for (const rp of replyDocs) {
    const threadTitle = rp.thread?.title || "a thread";
    resolved[rp.id] = {
      label: `Reply in: ${threadTitle}`,
      link: rp.thread?.id ? `/community/forums/thread/${rp.thread.id}` : null,
    };
  }
  for (const rp of replyByOid) {
    const threadTitle = rp.thread?.title || "a thread";
    resolved[String(rp._id)] = {
      label: `Reply in: ${threadTitle}`,
      link: rp.thread?.id ? `/community/forums/thread/${rp.thread.id}` : null,
    };
  }
  const labelForCommentLocation = (loc) => {
    if (!loc) return "Comment";
    if (loc.startsWith("role/")) return `Comment on Role: ${loc.slice(5)}`;
    if (loc.startsWith("setup/")) return `Comment on Setup: ${loc.slice(6)}`;
    if (loc.startsWith("family/")) return `Comment on Family: ${loc.slice(7)}`;
    if (loc === "lobby" || loc.startsWith("lobby-")) return "Comment in Lobby";
    return `Comment on Profile: ${loc}`;
  };
  for (const c of commentDocs)
    resolved[c.id] = {
      label: labelForCommentLocation(c.location),
      link: null,
    };
  for (const c of commentByOid)
    resolved[String(c._id)] = {
      label: labelForCommentLocation(c.location),
      link: null,
    };
  for (const s of strategyDocs)
    resolved[s.id] = { label: `Strategy: ${s.title || "untitled"}`, link: null };
  for (const s of strategyByOid)
    resolved[String(s._id)] = {
      label: `Strategy: ${s.title || "untitled"}`,
      link: null,
    };
  for (const d of deckDocs)
    resolved[d.id] = { label: `Deck: ${d.name || d.id}`, link: null };

  return rows.map((r) => {
    let label;
    let link = null;
    if (r.item && r.item.includes(":")) {
      const [, roleName] = r.item.split(":");
      label = `Role: ${roleName || r.item}`;
      link = `/learn/role/${roleName || r.item}`;
    } else if (r.item && resolved[r.item]) {
      label = resolved[r.item].label;
      link = resolved[r.item].link;
    } else {
      label = "an item";
    }
    return {
      id: `forumvote:${r._id}`,
      type: "upvote",
      category: "upvotes",
      actorId: r.voter,
      timestamp: r._id.getTimestamp().getTime(),
      targetType: "item",
      targetLabel: label,
      contentPreview: r.direction > 0 ? "Upvoted" : "Downvoted",
      link,
    };
  });
}

async function fetchSiteActivity(cutoff, limit) {
  const rows = await models.SiteActivity.find({ date: { $gte: cutoff } })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return rows.map((r) => {
    const map = {
      login: "logins",
      deckCreate: "profile",
      avatarChange: "profile",
      nameChange: "profile",
      settingsChange: "profile",
    };
    return {
      id: `activity:${r._id}`,
      type: r.type,
      category: map[r.type] || "profile",
      actorId: r.actorId,
      timestamp: r.date,
      targetType: "user",
      targetLabel: null,
      // Verbs like "logged in", "changed avatar" are rendered client-side
      // from the `type`. Only emit a preview here when it adds info the verb
      // alone wouldn't convey.
      contentPreview: (() => {
        switch (r.type) {
          case "nameChange":
            return r.meta?.oldName && r.meta?.newName
              ? `${r.meta.oldName} → ${r.meta.newName}`
              : "";
          case "deckCreate":
            return r.meta?.deckName || "";
          case "settingsChange":
            return r.meta?.prop || "";
          default:
            return "";
        }
      })(),
      link: null,
    };
  });
}

router.get("/feed", async function (req, res) {
  try {
    if (!(await guard(req, res))) return;

    const { key: windowKey, ms } = parseWindow(req);
    const cutoff = Date.now() - ms;

    const PAGE_SIZE = 30;
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    // Over-fetch from each source so the merged result has enough to slice
    // into the requested page. Capped to keep the query cost bounded on
    // very deep navigations.
    const PER_SOURCE_LIMIT = Math.min(400, (page + 1) * PAGE_SIZE * 2 + 60);

    const categories = String(req.query.categories || "")
      .split(",")
      .filter(Boolean);
    const allowed = (c) => categories.length === 0 || categories.includes(c);

    // Sample only the sources that can contribute to this response so the
    // fingerprint doesn't invalidate on unrelated activity.
    const sigTasks = {};
    if (allowed("comments")) sigTasks.comment = latestField(models.Comment, "date");
    if (allowed("forum")) {
      sigTasks.thread = latestField(models.ForumThread, "postDate");
      sigTasks.reply = latestField(models.ForumReply, "postDate");
    }
    if (allowed("setups")) sigTasks.setupVer = latestId(models.SetupVersion);
    if (allowed("polls")) sigTasks.pollVote = latestField(models.PollVote, "votedAt");
    if (allowed("profile") || allowed("logins")) {
      sigTasks.siteAct = latestField(models.SiteActivity, "date");
    }
    if (allowed("profile")) {
      sigTasks.stampTrade = latestField(models.StampTrade, "updatedAt");
    }
    if (allowed("mod")) {
      sigTasks.trophy = latestField(models.Trophy, "createdAt");
      sigTasks.modAction = latestField(models.ModAction, "date");
      sigTasks.report = latestField(models.Report, "createdAt");
    }
    if (allowed("upvotes")) sigTasks.forumVote = latestId(models.ForumVote);
    const sigKeys = Object.keys(sigTasks);
    const sigValues = await Promise.all(sigKeys.map((k) => sigTasks[k]));
    const sig = Object.fromEntries(sigKeys.map((k, i) => [k, sigValues[i]]));
    const etag = makeEtag({
      r: "feed",
      w: windowKey,
      p: page,
      c: [...categories].sort(),
      sig,
    });
    if (respondFresh(req, res, etag)) return;

    const fetchers = [];
    if (allowed("comments")) fetchers.push(fetchComments(cutoff, PER_SOURCE_LIMIT));
    if (allowed("forum")) {
      fetchers.push(fetchForumThreads(cutoff, PER_SOURCE_LIMIT));
      fetchers.push(fetchForumReplies(cutoff, PER_SOURCE_LIMIT));
    }
    if (allowed("setups")) fetchers.push(fetchSetupVersions(cutoff, PER_SOURCE_LIMIT));
    if (allowed("polls")) fetchers.push(fetchPollVotes(cutoff, PER_SOURCE_LIMIT));
    if (allowed("profile")) {
      fetchers.push(fetchStampTrades(cutoff, PER_SOURCE_LIMIT));
      fetchers.push(fetchSiteActivity(cutoff, PER_SOURCE_LIMIT));
    } else if (allowed("logins")) {
      // Logins live in SiteActivity alongside other profile events; when only
      // the logins category is requested, still pull SiteActivity.
      fetchers.push(fetchSiteActivity(cutoff, PER_SOURCE_LIMIT));
    }
    if (allowed("mod")) {
      fetchers.push(fetchTrophies(cutoff, PER_SOURCE_LIMIT));
      fetchers.push(fetchModActions(cutoff, PER_SOURCE_LIMIT));
      fetchers.push(fetchReports(cutoff, PER_SOURCE_LIMIT));
    }
    if (allowed("upvotes")) fetchers.push(fetchForumVotes(cutoff, PER_SOURCE_LIMIT));

    const chunks = await Promise.all(fetchers);
    let items = [].concat(...chunks);

    // Second filter pass — some sources produce multiple categories (e.g.
    // SiteActivity emits both logins and profile) and the allowed() gate
    // above is at the source level. Drop any row whose category the caller
    // didn't ask for.
    if (categories.length > 0) {
      items = items.filter((r) => categories.includes(r.category));
    }

    items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const total = items.length;
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    // hasMore is "best effort": if we over-fetched enough to fill the next
    // page, there's more. It may report false negatives near the upper
    // PER_SOURCE_LIMIT cap, but that only matters for very deep scrolling.
    const hasMore = total > end;
    items = items.slice(start, end);

    // Hydrate actors. Dedupe ids so we hit Redis once per unique user.
    const actorIds = Array.from(
      new Set(items.map((r) => r.actorId).filter(Boolean))
    );
    const actorInfo = {};
    await Promise.all(
      actorIds.map(async (id) => {
        actorInfo[id] = await getBasicUserInfo(id, true);
      })
    );

    const hydrated = items.map((r) => {
      const info = r.actorId ? actorInfo[r.actorId] : null;
      return {
        ...r,
        actorName: info?.name || null,
        actorAvatar: info?.avatar ?? false,
        actorVanityUrl: info?.vanityUrl || null,
      };
    });

    res.status(200).send({ items: hydrated, page, hasMore });
  } catch (e) {
    logger.error(e);
    res.status(500).send("Error getting activity feed.");
  }
});

module.exports = router;
