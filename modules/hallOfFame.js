const models = require("../db/models");
const redis = require("./redis");
const roleData = require("../data/roles");
const {
  isCountableScrapbookRole,
  getTotalObtainableStamps,
} = require("../shared/scrapbook");
const skillRating = require("./skillRating");
const { DEFAULT_MU, DEFAULT_SIGMA } = skillRating;

const TOTAL_OBTAINABLE_STAMPS = getTotalObtainableStamps(roleData);

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const SUPPORTED_TIME_RANGES = ["all"];
const SUPPORTED_CATEGORIES = ["skillRating", "statistics"];
const SUPPORTED_SORT_DIRECTIONS = ["asc", "desc"];
const SUPPORTED_SORT_KEYS = [
  "username",
  "trophyScore",
  "wins",
  "losses",
  "totalGames",
  "kudos",
  "karma",
  "achievementScore",
  "achievementsCount",
  "scrapbookCompletion",
  "scrapbookCount",
  "skillRating",
  "skillMu",
  "skillSigma",
  "skillGamesPlayed",
  "skillTier",
];

const TROPHY_TYPE_WEIGHTS = {
  crown: 3,
  bronze: 5,
  silver: 8,
  gold: 12,
};

const CATEGORY_DEFINITIONS = {
  skillRating: {
    metricKey: "skillRating",
    metricLabel: "Conservative Rank",
    tieBreakers: ["skillMu", "skillGamesPlayed", "skillSigma"],
  },
  statistics: {
    metricKey: "trophyScore",
    metricLabel: "Trophy Score",
    tieBreakers: [
      "achievementsCount",
      "kudos",
      "karma",
      "scrapbookCompletion",
      "wins",
    ],
  },
};

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function normalizeCategory(category) {
  if (SUPPORTED_CATEGORIES.includes(category)) return category;
  return null;
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

function roundMetric(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function getTrophyWeight(type) {
  return TROPHY_TYPE_WEIGHTS[type] || TROPHY_TYPE_WEIGHTS.silver;
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
  const definition =
    CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS.skillRating;
  const keys = [sortBy, ...(definition.tieBreakers || []), "username"];

  for (const key of keys) {
    if (!key) continue;
    if (key === "username") {
      const nameCompare = String(a.username || "").localeCompare(
        String(b.username || "")
      );
      if (nameCompare !== 0) {
        return key === sortBy && sortDirection === "desc"
          ? -nameCompare
          : nameCompare;
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
  if (!userIds.length) {
    return { scrapbookDataByUser: {}, scrapbookTotal: TOTAL_OBTAINABLE_STAMPS };
  }

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

  for (const group of stampGroups) {
    const { userId, gameType, role } = group._id;
    if (!isCountableScrapbookRole(roleData, gameType, role)) continue;

    if (!scrapbookDataByUser[userId]) {
      scrapbookDataByUser[userId] = { scrapbookCount: 0 };
    }

    scrapbookDataByUser[userId].scrapbookCount += 1;
  }

  return {
    scrapbookDataByUser,
    scrapbookTotal: TOTAL_OBTAINABLE_STAMPS,
  };
}

async function buildRows() {
  const users = await models.User.find({
    deleted: false,
    playedGame: true,
  })
    .select(
      "id name avatar stats kudos karma achievementCount settings skillRating"
    )
    .lean();

  const userIds = users.map((user) => user.id);
  const [vanityUrlMap, trophyDataByUser, scrapbookData] = await Promise.all([
    getVanityUrlMap(userIds),
    getTrophyDataByUser(userIds),
    getScrapbookDataByUser(userIds),
  ]);

  const { scrapbookDataByUser, scrapbookTotal } = scrapbookData;

  const activeRanks = [];
  for (const user of users) {
    if (user.skillRating && user.skillRating.gamesPlayed > 0) {
      const mu = user.skillRating.mu ?? DEFAULT_MU;
      const sigma = user.skillRating.sigma ?? DEFAULT_SIGMA;
      activeRanks.push(mu - 3.0 * sigma);
    }
  }
  activeRanks.sort((a, b) => a - b);

  const rows = users.map((user) => {
    const winsLosses = getWinsLosses(user.stats);
    const trophyData = trophyDataByUser[user.id] || {
      trophies: [],
      trophyScore: 0,
    };
    const scrapbookInfo = scrapbookDataByUser[user.id] || {
      scrapbookCount: 0,
    };

    const mu = user.skillRating?.mu ?? DEFAULT_MU;
    const sigma = user.skillRating?.sigma ?? DEFAULT_SIGMA;
    const gamesPlayed = user.skillRating?.gamesPlayed ?? 0;
    const conservativeRank = mu - 3.0 * sigma;
    const tier =
      gamesPlayed > 0
        ? skillRating.getTier(conservativeRank, activeRanks)
        : "Unranked";

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
      kudos: Number(user.kudos || 0),
      karma: Number(user.karma || 0),
      achievementsCount: Number(user.achievementCount || 0),
      achievementScore: Number(user.achievementCount || 0),
      scrapbookCount: scrapbookInfo.scrapbookCount,
      scrapbookCompletion: scrapbookTotal
        ? roundMetric((scrapbookInfo.scrapbookCount / scrapbookTotal) * 100, 2)
        : 0,
      privacy: {
        hideStatistics: Boolean(user.settings?.hideStatistics),
        hideKarma: Boolean(user.settings?.hideKarma),
      },
      skillRating: roundMetric(conservativeRank, 4),
      skillMu: roundMetric(mu, 4),
      skillSigma: roundMetric(sigma, 4),
      skillTier: tier,
      skillGamesPlayed: gamesPlayed,
    };
  });

  return {
    rows,
    scrapbookTotal,
  };
}

function applyCategoryRules(rows, category) {
  if (category === "skillRating") {
    return rows.filter((row) => row.skillGamesPlayed > 0);
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
    kudos: row.kudos,
    karma: row.karma,
    achievementsCount: row.achievementsCount,
    achievementScore: row.achievementScore,
    scrapbookCount: row.scrapbookCount,
    scrapbookCompletion: row.scrapbookCompletion,
    skillRating: row.skillRating,
    skillMu: row.skillMu,
    skillSigma: row.skillSigma,
    skillTier: row.skillTier,
    skillGamesPlayed: row.skillGamesPlayed,
  }));
}

async function getLeaderboard({
  category = "skillRating",
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  timeRange = "all",
  sortBy = null,
  sortDirection = "desc",
  userId = null,
}) {
  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) {
    throw new Error("Unsupported Hall of Fame category.");
  }

  if (!SUPPORTED_TIME_RANGES.includes(timeRange)) {
    throw new Error("Unsupported Hall of Fame time range.");
  }

  const safePage = clampInt(page, 1, 1, 1000);
  const safePageSize = clampInt(pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const defaultSortBy = CATEGORY_DEFINITIONS[normalizedCategory].metricKey;
  const safeSortBy = SUPPORTED_SORT_KEYS.includes(sortBy) ? sortBy : defaultSortBy;
  const safeSortDirection = SUPPORTED_SORT_DIRECTIONS.includes(sortDirection)
    ? sortDirection
    : "desc";

  const cacheKey = [
    "hof",
    normalizedCategory,
    timeRange,
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
  const filteredRows = applyCategoryRules(rows, normalizedCategory);
  const rankedRows = assignRanks(
    filteredRows,
    normalizedCategory,
    safeSortBy,
    safeSortDirection
  );
  const total = rankedRows.length;
  const pages = Math.max(Math.ceil(total / safePageSize), 1);
  const pageStart = (safePage - 1) * safePageSize;
  const pageRows = rankedRows.slice(pageStart, pageStart + safePageSize);

  const rankByUserId = {};
  for (const row of rankedRows) {
    rankByUserId[row.userId] = row.rank;
  }

  const response = {
    category: normalizedCategory,
    metric: CATEGORY_DEFINITIONS[normalizedCategory].metricKey,
    metricLabel: CATEGORY_DEFINITIONS[normalizedCategory].metricLabel,
    users: buildResponseRows(pageRows),
    total,
    page: safePage,
    pages,
    pageSize: safePageSize,
    filters: {
      timeRange,
    },
    sort: {
      sortBy: safeSortBy,
      sortDirection: safeSortDirection,
      defaultSortBy,
    },
    supportedFilters: {
      timeRanges: SUPPORTED_TIME_RANGES,
      categories: SUPPORTED_CATEGORIES,
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
      scrapbookTotal,
      tieBreakers: CATEGORY_DEFINITIONS[normalizedCategory].tieBreakers,
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
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SUPPORTED_CATEGORIES,
  SUPPORTED_TIME_RANGES,
  getLeaderboard,
  invalidateCache,
};
