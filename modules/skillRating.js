const models = require("../db/models");

const DEFAULT_MU = 25.0;
const DEFAULT_SIGMA = DEFAULT_MU / 3.0;

class AspectSkillRating {
  constructor(rating = DEFAULT_MU, uncertainty = DEFAULT_SIGMA) {
    this.rating = rating;
    this.uncertainty = uncertainty;
  }

  getRank() {
    return this.rating - 3.0 * this.uncertainty;
  }
}

function aspectSkillTwoTeams(winningTeam, losingTeam, config) {
  if (winningTeam.length === 0 || losingTeam.length === 0) {
    return [[...winningTeam], [...losingTeam]];
  }

  const { beta, dynamicsFactor: tau } = config;

  const nW = winningTeam.length;
  const nL = losingTeam.length;

  const muWinners = winningTeam.reduce((sum, r) => sum + r.rating, 0) / nW;
  const muLosers = losingTeam.reduce((sum, r) => sum + r.rating, 0) / nL;

  const sigmaSqWinners = winningTeam.reduce((sum, r) => sum + (Math.pow(r.uncertainty, 2) + Math.pow(tau, 2)), 0) / Math.pow(nW, 2);
  const sigmaSqLosers = losingTeam.reduce((sum, r) => sum + (Math.pow(r.uncertainty, 2) + Math.pow(tau, 2)), 0) / Math.pow(nL, 2);

  const omega = Math.sqrt(sigmaSqWinners + sigmaSqLosers + 2.0 * Math.pow(beta, 2));
  const oddsRatio = Math.exp((muWinners - muLosers) / omega);
  const adjustmentRatio = 1.0 / (1.0 + oddsRatio);

  const SIGMA_MIN_SQ = 0.01;

  const newWinners = winningTeam.map(rating => {
    const varianceWithTau = Math.pow(rating.uncertainty, 2) + Math.pow(tau, 2);
    const muShift = (varianceWithTau / (nW * omega)) * adjustmentRatio;
    
    const shrinkFactor = (varianceWithTau / (Math.pow(nW, 2) * Math.pow(omega, 2))) 
        * adjustmentRatio 
        * (1.0 - adjustmentRatio);
    
    const newVariance = Math.max(varianceWithTau * (1.0 - shrinkFactor), SIGMA_MIN_SQ);

    return new AspectSkillRating(
        rating.rating + muShift,
        Math.sqrt(newVariance)
    );
  });

  const newLosers = losingTeam.map(rating => {
    const varianceWithTau = Math.pow(rating.uncertainty, 2) + Math.pow(tau, 2);
    const muShift = (varianceWithTau / (nL * omega)) * adjustmentRatio;
    
    const shrinkFactor = (varianceWithTau / (Math.pow(nL, 2) * Math.pow(omega, 2))) 
        * adjustmentRatio 
        * (1.0 - adjustmentRatio);
    
    const newVariance = Math.max(varianceWithTau * (1.0 - shrinkFactor), SIGMA_MIN_SQ);

    return new AspectSkillRating(
        rating.rating - muShift,
        Math.sqrt(newVariance)
    );
  });

  return [newWinners, newLosers];
}

function expectedScoreTwoTeams(team1, team2, config) {
  if (team1.length === 0 || team2.length === 0) {
    return [0.5, 0.5];
  }

  const { beta, dynamicsFactor: tau } = config;

  const n1 = team1.length;
  const n2 = team2.length;

  const mu1 = team1.reduce((sum, r) => sum + r.rating, 0) / n1;
  const mu2 = team2.reduce((sum, r) => sum + r.rating, 0) / n2;

  const sigmaSq1 = team1.reduce((sum, r) => sum + (Math.pow(r.uncertainty, 2) + Math.pow(tau, 2)), 0) / Math.pow(n1, 2);
  const sigmaSq2 = team2.reduce((sum, r) => sum + (Math.pow(r.uncertainty, 2) + Math.pow(tau, 2)), 0) / Math.pow(n2, 2);

  const omega = Math.sqrt(sigmaSq1 + sigmaSq2 + 2.0 * Math.pow(beta, 2));
  const oddsRatio = Math.exp((mu1 - mu2) / omega);
  const prob1Wins = oddsRatio / (1.0 + oddsRatio);

  return [prob1Wins, 1.0 - prob1Wins];
}

async function updateGameRatings(game) {
  if (!game.ranked && !game.competitive) {
    return;
  }
  if (game.skillRefunded) {
    return;
  }
  if (game.skillRatingChanges && game.skillRatingChanges.length > 0) {
    return;
  }

  const playerIdMap = typeof game.playerIdMap === "string" ? JSON.parse(game.playerIdMap || "{}") : (game.playerIdMap || {});
  const winnerIds = new Set();
  if (Array.isArray(game.winners)) {
    game.winners.forEach(id => winnerIds.add(id));
  }
  if (game.winnersInfo && Array.isArray(game.winnersInfo.players)) {
    game.winnersInfo.players.forEach(id => winnerIds.add(id));
  }

  const winningUserIds = [];
  const losingUserIds = [];

  for (const userId of Object.keys(playerIdMap)) {
    const pid = playerIdMap[userId];
    if (winnerIds.has(pid)) {
      winningUserIds.push(userId);
    } else {
      losingUserIds.push(userId);
    }
  }

  if (winningUserIds.length === 0 || losingUserIds.length === 0) {
    return;
  }

  const allUserIds = [...winningUserIds, ...losingUserIds];
  const users = await models.User.find({ id: { $in: allUserIds } });
  const userMap = {};
  for (const user of users) {
    userMap[user.id] = user;
  }

  const winningTeam = winningUserIds.map(userId => {
    const user = userMap[userId];
    const mu = user?.skillRating?.mu ?? DEFAULT_MU;
    const sigma = user?.skillRating?.sigma ?? DEFAULT_SIGMA;
    return new AspectSkillRating(mu, sigma);
  });

  const losingTeam = losingUserIds.map(userId => {
    const user = userMap[userId];
    const mu = user?.skillRating?.mu ?? DEFAULT_MU;
    const sigma = user?.skillRating?.sigma ?? DEFAULT_SIGMA;
    return new AspectSkillRating(mu, sigma);
  });

  const [newWinners, newLosers] = aspectSkillTwoTeams(winningTeam, losingTeam, { beta: 6.0, dynamicsFactor: 0.02 });

  const ratingChanges = [];
  const bulkOps = [];

  const teams = [
    { userIds: winningUserIds, ratings: newWinners, oldRatings: winningTeam },
    { userIds: losingUserIds, ratings: newLosers, oldRatings: losingTeam },
  ];

  for (const { userIds, ratings, oldRatings } of teams) {
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const oldRating = oldRatings[i];
      const newRating = ratings[i];
      const muDelta = newRating.rating - oldRating.rating;
      const sigmaDelta = newRating.uncertainty - oldRating.uncertainty;

      ratingChanges.push({ userId, muDelta, sigmaDelta });
      bulkOps.push({
        updateOne: {
          filter: { id: userId },
          update: {
            $set: {
              "skillRating.mu": newRating.rating,
              "skillRating.sigma": newRating.uncertainty,
            },
            $inc: {
              "skillRating.gamesPlayed": 1
            }
          }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await models.User.bulkWrite(bulkOps);
  }

  // Update game with ratingChanges
  await models.Game.updateOne(
    { _id: game._id },
    { $set: { skillRatingChanges: ratingChanges } }
  ).exec();
  game.skillRatingChanges = ratingChanges;
}

async function refundGameRatings(game) {
  if (game.skillRefunded) {
    return;
  }
  if (!game.skillRatingChanges || game.skillRatingChanges.length === 0) {
    return;
  }

  // Batch-fetch all affected users in a single query instead of one-by-one
  const changeUserIds = game.skillRatingChanges.map(c => c.userId);
  const usersArr = await models.User.find({ id: { $in: changeUserIds } }).select("id skillRating").lean();
  const userMap = new Map(usersArr.map(u => [u.id, u]));

  const bulkOps = [];
  const SIGMA_MIN = 0.1; // Math.sqrt(0.01)

  for (const change of game.skillRatingChanges) {
    const user = userMap.get(change.userId);
    if (!user) continue;

    const currentMu = user.skillRating?.mu ?? DEFAULT_MU;
    const newMu = currentMu - change.muDelta;

    bulkOps.push({
      updateOne: {
        filter: { id: change.userId },
        update: {
          $set: {
            "skillRating.mu": newMu,
          },
          $inc: {
            "skillRating.gamesPlayed": -1
          }
        }
      }
    });
  }

  if (bulkOps.length > 0) {
    await models.User.bulkWrite(bulkOps);
  }

  await models.Game.updateOne(
    { _id: game._id },
    { $set: { skillRefunded: true } }
  ).exec();
  game.skillRefunded = true;
}

function getTier(rank, sortedRanks) {
  if (sortedRanks.length === 0) return "Unranked";

  // Binary search to find insertion index (avoids float equality issues with indexOf)
  let lo = 0;
  let hi = sortedRanks.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedRanks[mid] < rank) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // lo is the insertion point; check if the rank is actually in the array within float tolerance
  let index = lo;
  const tolerance = 1e-9;
  let found = false;
  if (lo < sortedRanks.length && Math.abs(sortedRanks[lo] - rank) < tolerance) {
    found = true;
    index = lo;
  } else if (lo > 0 && Math.abs(sortedRanks[lo - 1] - rank) < tolerance) {
    found = true;
    index = lo - 1;
  }

  if (!found) return "Unranked";

  const percentile = sortedRanks.length > 1 ? (index / (sortedRanks.length - 1)) * 100 : 100;
  if (percentile >= 98) return "Master";
  if (percentile >= 90) return "Diamond";
  if (percentile >= 75) return "Platinum";
  if (percentile >= 50) return "Gold";
  if (percentile >= 20) return "Silver";
  return "Bronze";
}

module.exports = {
  DEFAULT_MU,
  DEFAULT_SIGMA,
  AspectSkillRating,
  aspectSkillTwoTeams,
  expectedScoreTwoTeams,
  updateGameRatings,
  refundGameRatings,
  getTier,
};
