const constants = require("../data/constants");
const models = require("../db/models");
const redis = require("./redis");
const fortunePoints = require("./fortunePoints");
const skillRating = require("./skillRating");
const logger = require("./logging")(".");

function revertStats(
  stats,
  gameType,
  setupId,
  role,
  alignment,
  won,
  abandoned
) {
  if (!stats[gameType]) return stats;

  const gameStats = stats[gameType];

  function updateStatsObj(statsObj, stat, inc) {
    if (stat !== "totalGames") {
      if (statsObj[stat]) {
        statsObj[stat].total = Math.max(0, statsObj[stat].total - 1);
        if (inc && statsObj[stat].count > 0) {
          statsObj[stat].count = Math.max(0, statsObj[stat].count - 1);
        }
      }
    } else if (statsObj.totalGames) {
      statsObj.totalGames = Math.max(0, statsObj.totalGames - 1);
    }
  }

  if (gameStats.all) {
    if (won) updateStatsObj(gameStats.all, "wins", true);
    else updateStatsObj(gameStats.all, "wins", false);

    if (abandoned) updateStatsObj(gameStats.all, "abandons", true);
  }

  if (gameStats.bySetup && gameStats.bySetup[setupId]) {
    if (won) updateStatsObj(gameStats.bySetup[setupId], "wins", true);
    else updateStatsObj(gameStats.bySetup[setupId], "wins", false);

    if (abandoned)
      updateStatsObj(gameStats.bySetup[setupId], "abandons", true);
  }

  if (role && gameStats.byRole && gameStats.byRole[role]) {
    if (won) updateStatsObj(gameStats.byRole[role], "wins", true);
    else updateStatsObj(gameStats.byRole[role], "wins", false);

    if (abandoned) updateStatsObj(gameStats.byRole[role], "abandons", true);
  }

  if (alignment && gameStats.byAlignment && gameStats.byAlignment[alignment]) {
    if (won) updateStatsObj(gameStats.byAlignment[alignment], "wins", true);
    else updateStatsObj(gameStats.byAlignment[alignment], "wins", false);

    if (abandoned)
      updateStatsObj(gameStats.byAlignment[alignment], "abandons", true);
  }

  return stats;
}

async function precomputeFortune(game, playerIdMap, playerAlignmentMap) {
  if (!game.history || !game.setup) return null;

  try {
    const history = JSON.parse(game.history);
    const originalRoles = history.originalRoles || {};
    const memberFactionsByPlayerId = {};
    for (let uid in playerIdMap) {
      const pid = playerIdMap[uid];
      if (!originalRoles[pid]) continue;
      const alignment = playerAlignmentMap[uid] || "";
      const alignmentIsFaction =
        alignment === "Village" ||
        alignment === "Mafia" ||
        alignment === "Cult";
      let factionName = alignmentIsFaction
        ? alignment
        : originalRoles[pid].split(":")[0];
      if (factionName === "Traitor") {
        factionName = "Mafia";
      }
      memberFactionsByPlayerId[pid] = factionName;
    }
    const factionNames = [
      ...new Set(Object.values(memberFactionsByPlayerId)),
    ].sort();
    const winnerPids = new Set((game.winners || []).map((p) => String(p)));
    const winningFactions = [
      ...new Set(
        Object.entries(memberFactionsByPlayerId)
          .filter(([pid]) => winnerPids.has(String(pid)))
          .map(([, faction]) => faction)
      ),
    ];
    const setupDoc = await models.Setup.findOne({ _id: game.setup })
      .select("version")
      .lean();
    const sv =
      setupDoc &&
      (await models.SetupVersion.findOne({
        setup: game.setup,
        version: setupDoc.version || 0,
      })
        .select("setupStats")
        .lean());
    const alignmentWinRates = fortunePoints.alignmentRowsToWinRateMap(
      sv && sv.setupStats
    );
    const { pointsWonByFactions, pointsLostByFactions } =
      fortunePoints.computeFactionFortunePoints({
        factionNames,
        winningFactions,
        alignmentWinRates,
        K: constants.fortunePointsNominalK,
      });
    return {
      memberFactionsByPlayerId,
      pointsWonByFactions,
      pointsLostByFactions,
    };
  } catch (e) {
    logger.error(
      `Error precomputing fortune for refund game ${game.id}:`,
      e
    );
    return null;
  }
}

/**
 * Refund a single Game document (skill ratings, coins, hearts, stats, fortune).
 */
async function refundGameDocument(game) {
  if (!game.endTime) {
    const err = new Error("Cannot refund a game that hasn't ended.");
    err.status = 400;
    throw err;
  }

  if (!game.ranked && !game.competitive) {
    const err = new Error(
      "Cannot refund a game that was not ranked or competitive."
    );
    err.status = 400;
    throw err;
  }

  try {
    await skillRating.refundGameRatings(game);
  } catch (e) {
    logger.error(`Error refunding skill ratings for game ${game.id}:`, e);
  }

  const playerIdMap = JSON.parse(game.playerIdMap || "{}");
  const playerAlignmentMap = JSON.parse(game.playerAlignmentMap || "{}");
  const userIds = Object.keys(playerIdMap);

  if (userIds.length === 0) {
    return { playerCount: 0 };
  }

  const precomputedFortune = await precomputeFortune(
    game,
    playerIdMap,
    playerAlignmentMap
  );

  for (let userIdToRefund of userIds) {
    try {
      const playerId = playerIdMap[userIdToRefund];
      const alignment = playerAlignmentMap[userIdToRefund];

      var user = await models.User.findOne({ id: userIdToRefund }).exec();
      if (!user) continue;

      const won =
        game.winners.includes(playerId) ||
        (game.winnersInfo &&
          game.winnersInfo.players &&
          game.winnersInfo.players.includes(playerId));

      const abandoned = game.left && game.left.includes(playerId);
      const gotKudos = game.kudosReceiver === playerId;

      let coinsToRevert = 0;
      if (game.ranked && won) {
        coinsToRevert += 1;
      }

      let pointsToRevert = 0;
      let pointsNegativeToRevert = 0;

      if (precomputedFortune) {
        const playerFaction =
          precomputedFortune.memberFactionsByPlayerId[playerId];
        if (playerFaction) {
          const maxEarnedPoints = constants.fortunePointsNominalK * 20;
          let pointsEarned = won
            ? precomputedFortune.pointsWonByFactions[playerFaction]
            : precomputedFortune.pointsLostByFactions[playerFaction];

          if (pointsEarned > maxEarnedPoints) {
            pointsEarned = maxEarnedPoints;
          }

          if (won) {
            pointsToRevert = pointsEarned;
          } else {
            pointsNegativeToRevert = pointsEarned;
          }
        }
      }

      const setupId = game.setup ? String(game.setup) : null;

      user.stats = revertStats(
        user.stats,
        game.type,
        setupId,
        null,
        alignment,
        won,
        abandoned
      );

      const updateOps = {
        $pull: { games: game._id },
        $set: {
          stats: user.stats,
        },
      };

      const incOps = {};

      if (gotKudos) {
        incOps.kudos = -1;
      }

      if (coinsToRevert > 0) {
        incOps.coins = -coinsToRevert;
      }

      if (game.ranked) {
        var itemsOwned = await redis.getUserItemsOwned(userIdToRefund);
        const redHeartCapacity =
          constants.initialRedHeartCapacity +
          (itemsOwned?.bonusRedHearts || 0);
        updateOps.$set.redHearts = redHeartCapacity;
      }

      if (game.competitive) {
        updateOps.$set.goldHearts = constants.initialGoldHeartCapacity;
      }

      if (pointsToRevert > 0) {
        incOps.points = -pointsToRevert;
      }
      if (pointsNegativeToRevert > 0) {
        incOps.pointsNegative = -pointsNegativeToRevert;
      }

      if (Object.keys(incOps).length > 0) {
        updateOps.$inc = incOps;
      }

      const newWinRate =
        (user.stats[game.type]?.all?.wins?.count || 0) /
        (user.stats[game.type]?.all?.wins?.total || 1);
      updateOps.$set.winRate = newWinRate;

      await models.User.updateOne({ id: userIdToRefund }, updateOps).exec();
      await redis.cacheUserInfo(userIdToRefund, true);
    } catch (e) {
      logger.error(`Error refunding game for user ${userIdToRefund}:`, e);
    }
  }

  return { playerCount: userIds.length };
}

/**
 * Invalidate competitive completions for the given Game ObjectIds and restore
 * the spent gold heart for each completion. Skips when refundGameDocument
 * already restored gold hearts to capacity (caller can pass restoreHearts=false).
 */
async function invalidateCompetitiveCompletions(gameObjectIds, { restoreHearts = true } = {}) {
  if (!gameObjectIds.length) return 0;

  const gameCompletions = await models.CompetitiveGameCompletion.find({
    game: { $in: gameObjectIds },
    valid: { $ne: false },
  });

  for (const gameCompletion of gameCompletions) {
    if (restoreHearts) {
      await models.User.updateOne(
        { id: gameCompletion.userId },
        { $inc: { goldHearts: 1 } }
      );
      await redis.invalidateCachedUser(gameCompletion.userId);
    }
    await models.CompetitiveGameCompletion.updateOne(
      { _id: gameCompletion._id },
      { $set: { valid: false } }
    );
  }

  return gameCompletions.length;
}

/**
 * Refund every Game document with the given public `id` (handles duplicate rows).
 * Also invalidates CompetitiveGameCompletion rows for those documents.
 *
 * @returns {{ gamesRefunded: number, playerCount: number, completionsInvalidated: number, ranked: boolean, competitive: boolean }}
 */
async function refundGamesByPublicId(gameId) {
  const games = await models.Game.find({ id: gameId }).exec();

  if (!games.length) {
    const err = new Error("Game not found.");
    err.status = 404;
    throw err;
  }

  const eligible = games.filter((g) => g.ranked || g.competitive);
  if (!eligible.length) {
    const err = new Error(
      "Cannot refund a game that was not ranked or competitive."
    );
    err.status = 400;
    throw err;
  }

  const unfinished = eligible.filter((g) => !g.endTime);
  if (unfinished.length === eligible.length) {
    const err = new Error("Cannot refund a game that hasn't ended.");
    err.status = 400;
    throw err;
  }

  let playerCount = 0;
  let gamesRefunded = 0;
  let anyRanked = false;
  let anyCompetitive = false;

  for (const game of eligible) {
    if (!game.endTime) continue;
    anyRanked = anyRanked || !!game.ranked;
    anyCompetitive = anyCompetitive || !!game.competitive;
    const result = await refundGameDocument(game);
    playerCount = Math.max(playerCount, result.playerCount);
    gamesRefunded += 1;
  }

  // Hearts already restored to capacity by refundGameDocument for competitive
  // games; only invalidate completion rows here.
  const completionsInvalidated = await invalidateCompetitiveCompletions(
    eligible.map((g) => g._id),
    { restoreHearts: false }
  );

  return {
    gamesRefunded,
    playerCount,
    completionsInvalidated,
    ranked: anyRanked,
    competitive: anyCompetitive,
  };
}

function formatRefundSummary(result) {
  const heartLabel =
    result.ranked && result.competitive
      ? "red/gold"
      : result.ranked
        ? "red"
        : "gold";
  const dupeNote =
    result.gamesRefunded > 1
      ? ` Refunded ${result.gamesRefunded} stored copies of this game id.`
      : "";
  const completionNote =
    result.completionsInvalidated > 0
      ? ` Invalidated ${result.completionsInvalidated} competitive completion(s).`
      : "";
  return (
    `Successfully refunded game for ${result.playerCount} player(s). ` +
    `Reverted: win/loss/abandonment statistics, kudos, coins from wins, ${heartLabel} hearts, skill ratings, and fortune/misfortune points.` +
    dupeNote +
    completionNote
  );
}

module.exports = {
  refundGameDocument,
  refundGamesByPublicId,
  invalidateCompetitiveCompletions,
  formatRefundSummary,
};
