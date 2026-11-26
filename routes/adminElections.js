const express = require("express");
const { Types } = require("mongoose");
const models = require("../db/models");
const errors = require("../lib/errors");
const logger = require("../modules/logging")("(admin elections)");
const routeUtils = require("./utils");
const {
  ADMIN_GROUP,
  MAX_NOMINEES,
  MAX_TERM_DAYS,
  DAY,
  isElectionAdmin,
  electionPhase,
  countableRankings,
  countRankedBallots,
} = require("../modules/adminElections");

const router = express.Router();
const PAGE_SIZE = 20;

function parseElectionDate(value) {
  return new Date(typeof value === "string" ? value : NaN);
}

function readElectionSettings({ title, votingStartsAt, votingEndsAt, termDays }) {
  const start = parseElectionDate(votingStartsAt);
  const end = parseElectionDate(votingEndsAt);
  if (typeof title !== "string" || !title.trim() || title.trim().length > 100)
    return { error: "Enter an election title of up to 100 characters." };
  if (!(end > start))
    return { error: "Voting must close after it opens." };
  if (!Number.isInteger(termDays) || termDays < 1 || termDays > MAX_TERM_DAYS)
    return { error: `Enter a term of 1 to ${MAX_TERM_DAYS} days.` };
  return {
    settings: { title: title.trim(), votingStartsAt: start, votingEndsAt: end, termDays },
  };
}

async function currentUser(req) {
  const id = routeUtils.getUserId(req);
  if (!id) return null;
  return models.User.findOne({ id, deleted: false }).select("id").lean();
}

function handle(action, { login = false, admin = false } = {}) {
  return async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    try {
      const user = await currentUser(req);
      if ((login || admin) && !user)
        return errors.unauthorized(res, "Sign in to take part in elections.");
      if (admin && !(await isElectionAdmin(user)))
        return errors.forbidden(res, "Only current admins can manage elections.");
      await action(req, res, user);
    } catch (error) {
      // Database errors can contain the update document, including a ballot.
      logger.error(`Election request failed: ${error.name}`);
      errors.serverError(res, "Could not complete the election request. Please try again.");
    }
  };
}

router.param("electionId", (req, res, next, value) => {
  if (!/^[a-f0-9]{24}$/.test(value))
    return errors.notFound(res, "Election not found.");
  req.electionId = new Types.ObjectId(value);
  next();
});

router.get("/", handle(async (req, res, user) => {
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
    return errors.badRequest(res, "Invalid page.");
  const projection = {
    title: 1,
    createdBy: 1,
    votingStartsAt: 1,
    votingEndsAt: 1,
    termDays: 1,
    nominees: 1,
    certifiedAt: 1,
    certifiedBy: 1,
    outcome: 1,
    winnerId: 1,
    termEndsAt: 1,
  };
  if (user) projection.myBallot = { $ifNull: [`$ballots.${user._id}`, []] };
  const [elections, canManage] = await Promise.all([
    models.AdminElection.aggregate([
      { $sort: { votingEndsAt: -1, _id: -1 } },
      { $skip: (page - 1) * PAGE_SIZE },
      { $limit: PAGE_SIZE + 1 },
      { $project: projection },
    ]),
    user ? isElectionAdmin(user) : false,
  ]);
  const pageElections = elections.slice(0, PAGE_SIZE);
  // Read current avatar flags for this page, including nominations saved
  // before avatars were displayed. The election keeps its original names.
  const nomineeIds = [...new Set(pageElections.flatMap(
    (election) => election.nominees.map(({ id }) => id)
  ))];
  const nomineeUsers = nomineeIds.length ? await models.User.find({
    id: { $in: nomineeIds },
    deleted: false,
    avatar: true,
  }).select("id -_id").lean() : [];
  const nomineeAvatars = new Set(nomineeUsers.map(({ id }) => id));
  const now = new Date();
  res.json({
    elections: pageElections.map(({ _id, myBallot, ...election }) => ({
      ...election,
      id: _id.toString(),
      nominees: election.nominees.map(({ id, name }) => ({
        id, name, avatar: nomineeAvatars.has(id),
      })),
      phase: electionPhase(election, now),
      ...(myBallot?.length && now < election.votingEndsAt ? { myBallot } : {}),
    })),
    canManage,
    canVote: !!user,
    hasMore: elections.length > PAGE_SIZE,
  });
}));

router.post("/", handle(async (req, res, user) => {
  const { settings, error } = readElectionSettings(req.body);
  if (error) return errors.badRequest(res, error);
  if (!(settings.votingStartsAt > new Date()))
    return errors.badRequest(res, "Voting must open in the future.");
  const election = await models.AdminElection.create({
    ...settings,
    createdBy: user.id,
  });
  res.status(201).json({ id: election.id });
}, { admin: true }));

router.put("/:electionId/settings", handle(async (req, res) => {
  const { settings, error } = readElectionSettings(req.body);
  if (error) return errors.badRequest(res, error);
  const update = await models.AdminElection.updateOne({
    _id: req.electionId,
    certifiedAt: null,
    $expr: { $and: [
      { $gt: ["$votingStartsAt", "$$NOW"] },
      { $gt: [settings.votingEndsAt, "$$NOW"] },
    ] },
  }, [{
    $set: {
      ...settings,
      title: { $literal: settings.title },
      votingStartsAt: { $max: [settings.votingStartsAt, "$$NOW"] },
      revision: { $add: ["$revision", 1] },
    },
  }]);
  if (!update.matchedCount)
    return errors.conflict(res, "Election settings can only be changed before voting opens, and the closing time must be in the future.");
  res.status(204).end();
}, { admin: true }));

router.patch("/:electionId/voting-close", handle(async (req, res) => {
  const closeNow = req.body.closeNow === true;
  const end = parseElectionDate(req.body.votingEndsAt);
  if (!closeNow && Number.isNaN(end.getTime()))
    return errors.badRequest(res, "Enter a valid closing time.");
  const update = await models.AdminElection.updateOne({
    _id: req.electionId,
    certifiedAt: null,
    $expr: { $and: [
      { $lte: ["$votingStartsAt", "$$NOW"] },
      { $gt: ["$votingEndsAt", "$$NOW"] },
      ...(closeNow ? [] : [{ $gt: [end, "$$NOW"] }]),
    ] },
  }, [{
    $set: {
      votingEndsAt: closeNow ? "$$NOW" : end,
      revision: { $add: ["$revision", 1] },
    },
  }]);
  if (!update.matchedCount)
    return errors.conflict(res, "Voting is not open, or the new closing time has already passed. Use Close voting now to end voting early.");
  res.status(204).end();
}, { admin: true }));

router.post("/:electionId/nominate", handle(async (req, res) => {
  const { userId } = req.body;
  if (typeof userId !== "string" || !userId || userId.length > 64)
    return errors.badRequest(res, "Select a user to nominate.");
  const nominee = await models.User.findOne({ id: userId, deleted: false })
    .select("id name -_id").lean();
  if (!nominee) return errors.notFound(res, "Nominee not found.");
  const update = await models.AdminElection.updateOne({
    _id: req.electionId,
    certifiedAt: null,
    "nominees.id": { $ne: nominee.id },
    $expr: { $and: [
      { $gt: ["$votingStartsAt", "$$NOW"] },
      { $lt: [{ $size: "$nominees" }, MAX_NOMINEES] },
    ] },
  }, {
    $push: { nominees: nominee },
    $inc: { revision: 1 },
  });
  if (!update.modifiedCount)
    return errors.conflict(res, `Nominations are closed, that user is already nominated, or the ${MAX_NOMINEES}-nominee limit was reached.`);
  res.status(204).end();
}, { admin: true }));

router.put("/:electionId/ballot", handle(async (req, res, user) => {
  const { ranking } = req.body;
  if (!Array.isArray(ranking) || ranking.length < 1 || ranking.length > MAX_NOMINEES ||
      ranking.some((id) => typeof id !== "string" || !id || id.length > 64) ||
      new Set(ranking).size !== ranking.length)
    return errors.badRequest(res, "Rank at least one nominee, and rank each nominee only once.");

  const linkedIds = (await routeUtils.getAltAccountIds(user.id)).filter((id) => id !== user.id);
  const linkedVoters = linkedIds.length ? await models.User.find({ id: { $in: linkedIds } })
    .select("_id").lean() : [];
  const ballotPath = `ballots.${user._id}`;
  const orderPath = `ballotOrder.${user._id}`;
  const update = await models.AdminElection.updateOne({
    _id: req.electionId,
    certifiedAt: null,
    "nominees.id": { $all: ranking },
    // Check and write in one operation, including concurrent submissions from
    // different linked accounts. Edits stay with the original account.
    ...(linkedVoters.length && {
      $or: [
        { [ballotPath]: { $exists: true } },
        { $nor: linkedVoters.map(({ _id }) => ({ [`ballots.${_id}`]: { $exists: true } })) },
      ],
    }),
    $expr: { $and: [
      { $lte: ["$votingStartsAt", "$$NOW"] },
      { $gt: ["$votingEndsAt", "$$NOW"] },
    ] },
  }, [{
    $set: {
      [ballotPath]: { $literal: ranking },
      [orderPath]: { $ifNull: [
        `$${orderPath}`,
        { $cond: [{ $eq: [{ $type: `$${ballotPath}` }, "missing"] }, { $add: ["$revision", 1] }, 0] },
      ] },
      revision: { $add: ["$revision", 1] },
    },
  }]);
  if (!update.matchedCount)
    return errors.conflict(res, "Voting must be open, all choices must be nominees, and only one ballot is allowed across linked accounts.");
  res.status(204).end();
}, { login: true }));

function uncertifiedClosedElection(id) {
  return {
    _id: id,
    certifiedAt: null,
    $expr: { $lte: ["$votingEndsAt", "$$NOW"] },
  };
}

async function readElectionOutcome(election) {
  const nominees = await models.User.find({
    id: { $in: election.nominees.map(({ id }) => id) },
    deleted: false,
  }).distinct("id");
  const rankings = await countableRankings(election.ballots || {}, election.ballotOrder || {});
  const { outcome, winnerId } = countRankedBallots(nominees, rankings);
  return { outcome, winnerId: winnerId ?? null };
}

router.get("/:electionId/result-preview", handle(async (req, res) => {
  const election = await models.AdminElection.findOne(uncertifiedClosedElection(req.electionId))
    .select("+ballots +ballotOrder").lean();
  if (!election)
    return errors.conflict(res, "An uncertified result is only available after voting closes.");
  res.json(await readElectionOutcome(election));
}, { admin: true }));

router.post("/:electionId/certify", handle(async (req, res, user) => {
  // Nominees and ballots are immutable once the database clock reaches closing.
  const closed = uncertifiedClosedElection(req.electionId);
  const election = await models.AdminElection.findOne(closed).select("+ballots +ballotOrder").lean();
  if (!election)
    return errors.conflict(res, "This election is still open or has already been certified.");

  if (!["elected", "tie", "noVotes"].includes(req.body.outcome) ||
      (req.body.outcome === "elected" ? typeof req.body.winnerId !== "string" : req.body.winnerId !== null))
    return errors.badRequest(res, "Review the result before certifying.");
  const result = await readElectionOutcome(election);
  if (req.body.outcome !== result.outcome || req.body.winnerId !== result.winnerId)
    return errors.conflict(res, "The outcome changed. Review the updated result before certifying.");
  if (result.winnerId && !(await models.Group.exists({ name: ADMIN_GROUP })))
    return errors.conflict(res, "The Admin group must exist before certifying a winner.");

  const fields = {
    outcome: result.outcome,
    certifiedAt: "$$NOW",
    certifiedBy: { $literal: user.id },
  };
  if (result.winnerId) {
    fields.winnerId = { $literal: result.winnerId };
    fields.termEndsAt = { $add: ["$$NOW", { $multiply: ["$termDays", DAY] }] };
  }
  // The result, term grant, and ballot removal are a single atomic write.
  const update = await models.AdminElection.updateOne({
    ...closed,
    revision: election.revision,
  }, [
    { $set: fields },
    { $unset: ["ballots", "ballotOrder"] },
  ]);
  if (!update.modifiedCount)
    return errors.conflict(res, "The election changed. Refresh before trying to certify again.");
  res.status(204).end();
}, { admin: true }));

module.exports = router;
