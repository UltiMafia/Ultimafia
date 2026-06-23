const mafiaStatsObj = {
  totalGames: 0,
  wins: {
    count: 0, // games won
    total: 0, // games completed (wins + losses, excludes abandons)
  },
  abandons: {
    count: 0, // games abandoned
    total: 0, // always equals count (recordStat always called with inc=true)
  },
};

function mafiaStatsBucket() {
  return {
    ...mafiaStatsObj,
    wins: { ...mafiaStatsObj.wins },
    abandons: { ...mafiaStatsObj.abandons },
    bySetup: {},
    byRole: {},
    byAlignment: {},
  };
}

const mafiaStatsSet = {
  // "all" is legacy — contains only ranked + competitive stats
  all: mafiaStatsBucket(),
  unranked: mafiaStatsBucket(),
};

const allStats = {
  Mafia: mafiaStatsSet,
};

const LEGACY_MAPS = ["bySetup", "byRole", "byAlignment"];
const COUNT_TOTAL_STATS = ["wins", "abandons"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Ensure a single stats bucket or bySetup/byRole/byAlignment entry has all
 * required numeric fields. Mutates obj in place when possible.
 */
function ensureStatsObj(obj, gameType) {
  const template = statsObj(gameType);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return clone(template);
  }

  if (obj.totalGames == null) obj.totalGames = 0;

  for (const statName of COUNT_TOTAL_STATS) {
    if (!obj[statName] || typeof obj[statName] !== "object") {
      obj[statName] = { count: 0, total: 0 };
    } else {
      if (obj[statName].count == null) obj[statName].count = 0;
      if (obj[statName].total == null) obj[statName].total = 0;
    }
  }

  for (const mapName of LEGACY_MAPS) {
    if (obj[mapName] == null) obj[mapName] = {};
    else if (typeof obj[mapName] !== "object" || Array.isArray(obj[mapName])) {
      obj[mapName] = {};
    }
  }

  return obj;
}

function ensureBucket(gameStats, gameType, bucket) {
  if (!gameStats[bucket] || typeof gameStats[bucket] !== "object") {
    gameStats[bucket] = statsObj(gameType);
  } else {
    ensureStatsObj(gameStats[bucket], gameType);
  }
}

/**
 * Normalize a user's full stats tree (profile load, game join, etc.).
 * Fills missing buckets/fields and migrates legacy top-level maps into all.
 */
function normalizeUserStats(stats) {
  if (!stats || typeof stats !== "object") return stats;

  const templates = allStatsExport();

  for (const gameType of Object.keys(templates)) {
    if (!stats[gameType]) {
      stats[gameType] = statsSet(gameType);
      continue;
    }

    const templateSet = statsSet(gameType);
    const gameStats = stats[gameType];

    for (const objName of Object.keys(templateSet)) {
      if (!gameStats[objName]) {
        gameStats[objName] = clone(templateSet[objName]);
      } else if (typeof templateSet[objName] === "object") {
        if (objName === "all" || objName === "unranked") {
          ensureStatsObj(gameStats[objName], gameType);
        } else {
          for (const key of Object.keys(templateSet[objName])) {
            if (gameStats[objName][key] == null) {
              gameStats[objName][key] = clone(templateSet[objName][key]);
            }
          }
        }
      }
    }

    for (const mapName of LEGACY_MAPS) {
      const legacy = gameStats[mapName];
      if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) {
        continue;
      }

      ensureBucket(gameStats, gameType, "all");

      if (!gameStats.all[mapName]) gameStats.all[mapName] = {};

      for (const key of Object.keys(legacy)) {
        if (!gameStats.all[mapName][key]) {
          gameStats.all[mapName][key] = legacy[key];
        }
        ensureStatsObj(gameStats.all[mapName][key], gameType);
      }

      delete gameStats[mapName];
    }

    for (const bucketName of ["all", "unranked"]) {
      if (gameStats[bucketName]) {
        ensureStatsObj(gameStats[bucketName], gameType);
        for (const mapName of LEGACY_MAPS) {
          const map = gameStats[bucketName][mapName];
          if (!map || typeof map !== "object") continue;
          for (const key of Object.keys(map)) {
            ensureStatsObj(map[key], gameType);
          }
        }
      }
    }
  }

  return stats;
}

function getWinRateUpdates(stats) {
  const updates = {};
  const mafiaStats = stats && stats.Mafia;
  if (!mafiaStats) return updates;

  if (mafiaStats.all?.wins) {
    updates.winRate =
      (mafiaStats.all.wins.count || 0) / (mafiaStats.all.wins.total || 1);
  }

  if (mafiaStats.unranked?.wins) {
    updates.unrankedWinRate =
      (mafiaStats.unranked.wins.count || 0) /
      (mafiaStats.unranked.wins.total || 1);
  }

  return updates;
}

function buildNumericIncrements(before, after, prefix) {
  const increments = {};
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  for (const key of keys) {
    if (key.includes(".") || key.startsWith("$")) continue;

    const beforeValue = before ? before[key] : undefined;
    const afterValue = after ? after[key] : undefined;
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof afterValue === "number") {
      const diff = afterValue - (Number(beforeValue) || 0);
      if (diff) increments[path] = diff;
    } else if (
      afterValue &&
      typeof afterValue === "object" &&
      !Array.isArray(afterValue)
    ) {
      Object.assign(
        increments,
        buildNumericIncrements(beforeValue || {}, afterValue, path)
      );
    }
  }

  return increments;
}

function statsSet(gameType) {
  return clone(allStats[gameType]);
}

function statsObj(gameType) {
  return clone(allStats[gameType].all);
}

function allStatsExport() {
  return clone(allStats);
}

module.exports = {
  allStats: allStatsExport,
  statsSet,
  statsObj,
  ensureStatsObj,
  ensureBucket,
  normalizeUserStats,
  getWinRateUpdates,
  buildNumericIncrements,
};
