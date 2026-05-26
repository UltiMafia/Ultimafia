const models = require("../db/models");
const constants = require("../data/constants");
const redis = require("./redis");

async function getGamesPlayed(userObjectId) {
  const aggregation = await models.User.aggregate([
    { $match: { _id: userObjectId } },
    { $project: { count: { $size: "$games" } } },
  ]);

  return aggregation[0]?.count || 0;
}

async function ensureInGroup(user, group) {
  const existing = await models.InGroup.findOne({
    user: user._id,
    group: group._id,
  }).select("_id");

  if (existing) return false;

  await models.InGroup.create({
    user: user._id,
    group: group._id,
  });
  return true;
}

async function syncRankedCompetitiveAccess(userId, options = {}) {
  const user = await models.User.findOne({
    id: userId,
    deleted: false,
    banned: { $ne: true },
    flagged: { $ne: true },
  }).select("_id id games points");

  if (!user) {
    return {
      changed: false,
      rankedGranted: false,
      competitiveGranted: false,
      gamesPlayed: 0,
      points: 0,
    };
  }

  const minimumGames =
    options.minimumGames != null
      ? options.minimumGames
      : await redis.getMinimumGamesForRanked();
  const minimumPoints =
    options.minimumPoints != null
      ? options.minimumPoints
      : constants.minimumPointsForCompetitive;
  const gamesPlayed =
    user.games != null ? user.games.length : await getGamesPlayed(user._id);
  const points = Number(user.points || 0);

  const qualifiesForRanked = gamesPlayed >= minimumGames;
  const qualifiesForCompetitive =
    qualifiesForRanked && points >= minimumPoints;

  if (!qualifiesForRanked && !qualifiesForCompetitive) {
    return {
      changed: false,
      rankedGranted: false,
      competitiveGranted: false,
      gamesPlayed,
      points,
    };
  }

  const groups = await models.Group.find({
    name: { $in: ["Ranked Player", "Competitive Player"] },
  }).select("_id name");
  const rankedGroup = groups.find((group) => group.name === "Ranked Player");
  const competitiveGroup = groups.find(
    (group) => group.name === "Competitive Player"
  );

  let rankedGranted = false;
  let competitiveGranted = false;

  if (qualifiesForRanked && rankedGroup) {
    rankedGranted = await ensureInGroup(user, rankedGroup);
  }

  if (qualifiesForCompetitive && competitiveGroup) {
    competitiveGranted = await ensureInGroup(user, competitiveGroup);
  }

  const changed = rankedGranted || competitiveGranted;
  if (changed) {
    await redis.cacheUserInfo(userId, true);
  }

  if (changed || qualifiesForRanked || qualifiesForCompetitive) {
    await redis.cacheUserPermissions(userId);
  }

  return {
    changed,
    rankedGranted,
    competitiveGranted,
    gamesPlayed,
    points,
  };
}

module.exports = {
  syncRankedCompetitiveAccess,
};
