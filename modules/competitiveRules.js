const constants = require("../data/constants");

/**
 * Round rules for a competitive season.
 *
 * Seasons created before these settings existed have no stored values; they
 * keep the old behaviour (the global finish line and no point minimum) so a
 * deploy never changes the results of a round that is already running.
 */
function getSeasonRules(season) {
  const finishLinePoints = Number.isFinite(season?.finishLinePoints)
    ? season.finishLinePoints
    : constants.competitiveRoundFortuneHammer;
  const minimumPointsToPlace = Number.isFinite(season?.minimumPointsToPlace)
    ? season.minimumPointsToPlace
    : 0;
  return { finishLinePoints, minimumPointsToPlace };
}

/**
 * Rank players by round points.
 *
 * Only players at or above the point minimum are ranked; ties share a ranking.
 * Players below the minimum come after everyone ranked, sorted by points, with
 * `qualified: false` and a null ranking, so they earn no prestige.
 *
 * @param {Object<string, {points: number}>} users userId -> round totals
 * @param {number} minimumPointsToPlace
 */
function computeStandings(users, minimumPointsToPlace = 0) {
  const entries = Object.keys(users).map((userId) => ({
    userId,
    points: users[userId].points,
    qualified: users[userId].points >= minimumPointsToPlace,
  }));

  const qualifiedScores = entries
    .filter((entry) => entry.qualified)
    .map((entry) => entry.points)
    .sort((a, b) => b - a);
  const rankings = {};
  qualifiedScores.forEach((score, i) => {
    if (rankings[score] === undefined) {
      rankings[score] = i;
    }
  });

  const standings = entries.map((entry) => ({
    userId: entry.userId,
    ranking: entry.qualified ? rankings[entry.points] : null,
    points: entry.points,
    qualified: entry.qualified,
  }));
  standings.sort((a, b) => {
    if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
    if (a.qualified) return a.ranking - b.ranking;
    return b.points - a.points;
  });
  return standings;
}

module.exports = { getSeasonRules, computeStandings };
