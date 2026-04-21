const models = require("../db/models");
const redis = require("./redis");

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const DEFAULT_MIN_GAMES = 50;
const SUPPORTED_TIME_RANGES = ["all"];
const SUPPORTED_CATEGORIES = [
  "overall",
  "prestige",
  "trophies",
  "winRate",
  "kudos",
  "karma",
  "achievements",
  "scrapbook",
];
const SUPPORTED_SORT_DIRECTIONS = ["asc", "desc"];
const SUPPORTED_SORT_KEYS = [
  "username",
  "fortune",
  "prestige",
  "trophyScore",
  "winRate",
  "wins",
  "losses",
  "totalGames",
  "kudos",
  "karma",
  "achievementScore",
  "achievementsCount",
  "scrapbookCompletion",
  "scrapbookCount",
  "compositeScore",
];

const TROPHY_TYPE_WEIGHTS = {
  crown: 3,
  bronze: 5,
  silver: 8,
  gold: 12,
};

const CATEGORY_DEFINITIONS = {
  overall: {
    metricKey: "fortune",
    metricLabel: "Fortune",
    minGamesRequired: false,
    tieBreakers: ["prestige", "trophyScore", "winRate", "kudos", "karma", "wins"],
  },
  prestige: {
    metricKey: "prestige",
    metricLabel: "Prestige",
    minGamesRequired: false,
    tieBreakers: [
      "fortune",
      "trophyScore",
      "winRate",
      "kudos",
      "karma",
      "wins",
    ],
  },
  trophies: {
    metricKey: "trophyScore",
    metricLabel: "Trophy Score",
    minGamesRequired: false,
    tieBreakers: ["achievementScore", "winRate", "kudos", "karma", "wins"],
  },
  winRate: {
    metricKey: "winRate",
    metricLabel: "Win Rate",
    minGamesRequired: true,
    tieBreakers: ["wins", "trophyScore", "achievementScore", "kudos", "karma"],
  },
  kudos: {
    metricKey: "kudos",
    metricLabel: "Kudos",
    minGamesRequired: false,
    tieBreakers: ["karma", "trophyScore", "achievementScore", "winRate", "wins"],
  },
  karma: {
    metricKey: "karma",
    metricLabel: "Karma",
    minGamesRequired: false,
    tieBreakers: ["kudos", "trophyScore", "achievementScore", "winRate", "wins"],
  },
  achievements: {
    metricKey: "achievementScore",
    metricLabel: "Achievement Score",
    minGamesRequired: false,
    tieBreakers: ["achievementCount", "trophyScore", "winRate", "kudos", "karma"],
  },
  scrapbook: {
    metricKey: "scrapbookCompletion",
    metricLabel: "Scrapbook Completion",
    minGamesRequired: false,
    tieBreakers: ["scrapbookCount", "trophyScore", "achievementScore", "winRate"],
  },
};

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function getMafiaAllStats(stats) {
  return stats?.Mafia?.all || null;
}

function getWinsLosses(stats) {
  const mafiaStats = getMafiaAllStats(stats);
  const wins = Number(mafiaStats?.wins?.count || 0);
  const total = Number(mafiaStats?.wins?.total || 0);
  const losses = Math.max(total - wins, 0);
  return {
    wins,
    losses,
    totalGames: total,
  };
}

function safeRatio(numerator, denominator) {
  if (!denominator) return 0;
  return numerator / denominator;
}

function roundMetric(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function normalizeMetric(value, maxValue) {
  if (!maxValue || maxValue <= 0) return 0;
  return (value / maxValue) * 100;
}

function normalizeWinRate(row, minGames) {
  if (row.totalGames < minGames) return 0;
  return row.winRate * 100;
}

function adjustedCommunityScore(value) {
  if (value <= 0) return 0;
  return Math.log10(value + 1) * 25;
}

function getTrophyWeight(type) {
  return TROPHY_TYPE_WEIGHTS[type] || TROPHY_TYPE_WEIGHTS.silver;
}

function makeStampKey(stamp) {
  return `${stamp.gameType}:${stamp.role}`;
}

function compareValues(a, b, key, sortDirection = "desc") {
  const aValue = a[key] ?? 0;
  const bValue = b[key] ?? 0;
  if (bValue !== aValue) {
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;
    return (aValue - bValue) * directionMultiplier;
  }
  return 0;
}

function compareRows(a, b, category, sortBy, sortDirection) {
  const definition = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS.overall;
  const keys = [sortBy, ...(definition.tieBreakers || []), "username"];

  for (const key of keys) {
    if (!key) continue;
    if (key === "username") {
      const nameCompare = String(a.username || "").localeCompare(
        String(b.username || "")
      );
      if (nameCompare !== 0) {
        return key === sortBy && sortDirection === "desc" ? -nameCompare : nameCompare;
      }
      continue;
    }

    const compare = compareValues(
      a,
      b,
      key,
      key === sortBy ? sortDirection : "desc"
    );
    if (compare !== 0) return compare;
  }

  return String(a.userId || "").localeCompare(String(b.userId || ""));
}

async function getVanityUrlMap(userIds) {
  if (!userIds.length) return {};
  const vanityUrls = await models.VanityUrl.find({
    userId: { $in: userIds },
  })
    .select("userId url -_id")
    .lean();

  const vanityUrlMap = {};
  for (const vanityUrl of vanityUrls) {
    vanityUrlMap[vanityUrl.userId] = vanityUrl.url;
  }

  return vanityUrlMap;
}

async function getTrophyDataByUser(userIds) {
  if (!userIds.length) return {};
  const trophies = await models.Trophy.find({
    ownerId: { $in: userIds },
    revoked: false,
  })
    .select("id name ownerId type createdAt -_id")
    .sort({ createdAt: 1 })
    .lean();

  const trophyDataByUser = {};
  for (const trophy of trophies) {
    if (!trophyDataByUser[trophy.ownerId]) {
      trophyDataByUser[trophy.ownerId] = {
        trophies: [],
        trophyScore: 0,
      };
    }
    trophyDataByUser[trophy.ownerId].trophies.push(trophy);
    trophyDataByUser[trophy.ownerId].trophyScore += getTrophyWeight(trophy.type);
  }

  return trophyDataByUser;
}

async function getScrapbookDataByUser(userIds) {
  if (!userIds.length) return { scrapbookDataByUser: {}, scrapbookTotal: 0 };

  const stampGroups = await models.Stamp.aggregate([
    {
      $match: {
        userId: { $in: userIds },
        hidden: { $ne: true },
      },
    },
    {
      $group: {
        _id: {
          userId: "$userId",
          gameType: "$gameType",
          role: "$role",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const scrapbookDataByUser = {};
  const allUniqueStampKeys = new Set();

  for (const group of stampGroups) {
    const userId = group._id.userId;
    const stampKey = `${group._id.gameType}:${group._id.role}`;
    allUniqueStampKeys.add(stampKey);

    if (!scrapbookDataByUser[userId]) {
      scrapbookDataByUser[userId] = {
        scrapbookCount: 0,
      };
    }

    scrapbookDataByUser[userId].scrapbookCount += 1;
  }

  return {
    scrapbookDataByUser,
    scrapbookTotal: allUniqueStampKeys.size,
  };
}

async function buildRows() {
  const users = await models.User.find({
    deleted: false,
    playedGame: true,
  })
    .select(
      "id name avatar stats winRate kudos karma points championshipPoints achievementCount achievements settings"
    )
    .lean();

  const userIds = users.map((user) => user.id);
  const [vanityUrlMap, trophyDataByUser, scrapbookData] = await Promise.all([
    getVanityUrlMap(userIds),
    getTrophyDataByUser(userIds),
    getScrapbookDataByUser(userIds),
  ]);

  const { scrapbookDataByUser, scrapbookTotal } = scrapbookData;

  const rows = users.map((user) => {
    const winsLosses = getWinsLosses(user.stats);
    const trophyData = trophyDataByUser[user.id] || {
      trophies: [],
      trophyScore: 0,
    };
    const scrapbookInfo = scrapbookDataByUser[user.id] || {
      scrapbookCount: 0,
    };

    return {
      userId: user.id,
      username: user.name,
      avatar: Boolean(user.avatar),
      vanityUrl: vanityUrlMap[user.id] || "",
      trophies: trophyData.trophies,
      trophyScore: trophyData.trophyScore,
      wins: winsLosses.wins,
      losses: winsLosses.losses,
      totalGames: winsLosses.totalGames,
      winRate: roundMetric(user.winRate || safeRatio(winsLosses.wins, winsLosses.totalGames), 4),
      kudos: Number(user.kudos || 0),
      karma: Number(user.karma || 0),
      fortune: Number(user.points || 0),
      prestige: Number(user.championshipPoints || 0),
      achievementsCount: Number(user.achievementCount || 0),
      achievementScore: Number(user.achievementCount || 0),
      scrapbookCount: scrapbookInfo.scrapbookCount,
      scrapbookCompletion: scrapbookTotal
        ? roundMetric((scrapbookInfo.scrapbookCount / scrapbookTotal) * 100, 2)
        : 0,
      compositeScore: 0,
      privacy: {
        hideStatistics: Boolean(user.settings?.hideStatistics),
        hideKarma: Boolean(user.settings?.hideKarma),
      },
    };
  });

  const maxValues = rows.reduce(
    (acc, row) => ({
      trophyScore: Math.max(acc.trophyScore, row.trophyScore),
      achievementScore: Math.max(acc.achievementScore, row.achievementScore),
      scrapbookCompletion: Math.max(acc.scrapbookCompletion, row.scrapbookCompletion),
    }),
    {
      trophyScore: 0,
      achievementScore: 0,
      scrapbookCompletion: 0,
    }
  );

  for (const row of rows) {
    const normalizedTrophyScore = normalizeMetric(row.trophyScore, maxValues.trophyScore);
    const normalizedAchievementScore = normalizeMetric(
      row.achievementScore,
      maxValues.achievementScore
    );
    const normalizedScrapbookCompletion = normalizeMetric(
      row.scrapbookCompletion,
      maxValues.scrapbookCompletion
    );
    const normalizedWinRate = normalizeWinRate(row, DEFAULT_MIN_GAMES);
    const normalizedKudos = Math.min(adjustedCommunityScore(row.kudos), 100);
    const normalizedKarma = Math.min(adjustedCommunityScore(Math.max(row.karma, 0)), 100);

    row.compositeScore = roundMetric(
      normalizedTrophyScore * 0.3 +
        normalizedWinRate * 0.2 +
        normalizedKudos * 0.15 +
        normalizedKarma * 0.1 +
        normalizedAchievementScore * 0.15 +
        normalizedScrapbookCompletion * 0.1,
      2
    );
  }

  return {
    rows,
    scrapbookTotal,
  };
}

function applyCategoryRules(rows, category, minGames) {
  if (category === "winRate") {
    return rows.filter((row) => row.totalGames >= minGames);
  }

  return rows;
}

function assignRanks(rows, category, sortBy, sortDirection) {
  const sortedRows = [...rows].sort((a, b) =>
    compareRows(a, b, category, sortBy, sortDirection)
  );
  return sortedRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function buildResponseRows(rows) {
  return rows.map((row) => ({
    userId: row.userId,
    username: row.username,
    avatar: row.avatar,
    vanityUrl: row.vanityUrl,
    rank: row.rank,
    trophies: row.trophies,
    trophyScore: row.trophyScore,
    wins: row.wins,
    losses: row.losses,
    totalGames: row.totalGames,
    winRate: row.winRate,
    kudos: row.kudos,
    karma: row.karma,
    fortune: row.fortune,
    prestige: row.prestige,
    achievementsCount: row.achievementsCount,
    achievementScore: row.achievementScore,
    scrapbookCount: row.scrapbookCount,
    scrapbookCompletion: row.scrapbookCompletion,
    compositeScore: row.compositeScore,
  }));
}

async function getLeaderboard({
  category = "overall",
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  minGames = DEFAULT_MIN_GAMES,
  timeRange = "all",
  sortBy = null,
  sortDirection = "desc",
  userId = null,
}) {
  if (!SUPPORTED_CATEGORIES.includes(category)) {
    throw new Error("Unsupported Hall of Fame category.");
  }

  if (!SUPPORTED_TIME_RANGES.includes(timeRange)) {
    throw new Error("Unsupported Hall of Fame time range.");
  }

  const safePage = clampInt(page, 1, 1, 1000);
  const safePageSize = clampInt(pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const safeMinGames = clampNumber(minGames, DEFAULT_MIN_GAMES, 0, 10000);
  const defaultSortBy = CATEGORY_DEFINITIONS[category].metricKey;
  const safeSortBy = SUPPORTED_SORT_KEYS.includes(sortBy) ? sortBy : defaultSortBy;
  const safeSortDirection = SUPPORTED_SORT_DIRECTIONS.includes(sortDirection)
    ? sortDirection
    : "desc";

  const cacheKey = [
    "hof",
    category,
    timeRange,
    safeMinGames,
    safeSortBy,
    safeSortDirection,
    safePage,
    safePageSize,
  ].join(":");

  const cached = await redis.client.getAsync(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (userId) {
      parsed.myRank = parsed.rankByUserId?.[userId] || null;
    }
    delete parsed.rankByUserId;
    return parsed;
  }

  const { rows, scrapbookTotal } = await buildRows();
  const filteredRows = applyCategoryRules(rows, category, safeMinGames);
  const rankedRows = assignRanks(filteredRows, category, safeSortBy, safeSortDirection);
  const total = rankedRows.length;
  const pages = Math.max(Math.ceil(total / safePageSize), 1);
  const pageStart = (safePage - 1) * safePageSize;
  const pageRows = rankedRows.slice(pageStart, pageStart + safePageSize);

  const rankByUserId = {};
  for (const row of rankedRows) {
    rankByUserId[row.userId] = row.rank;
  }

  const response = {
    category,
    metric: CATEGORY_DEFINITIONS[category].metricKey,
    metricLabel: CATEGORY_DEFINITIONS[category].metricLabel,
    users: buildResponseRows(pageRows),
    total,
    page: safePage,
    pages,
    pageSize: safePageSize,
    filters: {
      timeRange,
      minGames: safeMinGames,
    },
    sort: {
      sortBy: safeSortBy,
      sortDirection: safeSortDirection,
      defaultSortBy,
    },
    supportedFilters: {
      timeRanges: SUPPORTED_TIME_RANGES,
      categories: SUPPORTED_CATEGORIES,
      minGames: {
        enabled: true,
        default: DEFAULT_MIN_GAMES,
      },
      gameMode: {
        enabled: false,
      },
      setup: {
        enabled: false,
      },
    },
    supportedSorts: {
      sortKeys: SUPPORTED_SORT_KEYS,
      directions: SUPPORTED_SORT_DIRECTIONS,
    },
    categoryMeta: {
      requiresMinGames: CATEGORY_DEFINITIONS[category].minGamesRequired,
      scrapbookTotal,
      tieBreakers: CATEGORY_DEFINITIONS[category].tieBreakers,
    },
    myRank: userId ? rankByUserId[userId] || null : null,
    rankByUserId,
  };

  await redis.client.setAsync(cacheKey, JSON.stringify(response));
  await redis.client.expire(cacheKey, 300);

  delete response.rankByUserId;
  return response;
}

function invalidateCache() {
  redis.deleteKeysByPattern("hof:*");
}

module.exports = {
  CATEGORY_DEFINITIONS,
  DEFAULT_MIN_GAMES,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SUPPORTED_CATEGORIES,
  SUPPORTED_TIME_RANGES,
  getLeaderboard,
  invalidateCache,
};
