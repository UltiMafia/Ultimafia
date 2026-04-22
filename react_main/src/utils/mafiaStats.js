// Helpers for reading Mafia per-player stats.
// Stats layout: { totalGames, wins: { count, total }, abandons: { count, total }, ... }
// - wins.total = games the player finished (win or loss), excluding abandons
// - wins.count = games the player won
// - abandons.count = games the player abandoned mid-game
//
// Some historical rows were written while abandons were also incrementing wins.total.
// Normalize those rows for display so percentages/pies remain accurate.

function normalizeStats(stats) {
  const winsCount = Math.max(0, Number(stats?.wins?.count) || 0);
  const winsTotalRaw = Math.max(winsCount, Number(stats?.wins?.total) || 0);
  const abandonCount = Math.max(0, Number(stats?.abandons?.count) || 0);
  const totalGamesField = Math.max(0, Number(stats?.totalGames) || 0);

  let completedGames = winsTotalRaw;

  // Heuristic for legacy/bad rows:
  // if totalGames is not greater than wins.total while abandons exist,
  // abandons were likely included in wins.total. Remove them once.
  if (abandonCount > 0 && totalGamesField > 0 && totalGamesField <= winsTotalRaw) {
    completedGames = Math.max(winsCount, winsTotalRaw - abandonCount);
  }

  const losses = Math.max(0, completedGames - winsCount);
  const totalGames = completedGames + abandonCount;

  return {
    wins: winsCount,
    losses,
    abandons: abandonCount,
    totalGames,
  };
}

export function getTotalGames(stats) {
  return normalizeStats(stats).totalGames;
}

export function getWins(stats) {
  return normalizeStats(stats).wins;
}

export function getLosses(stats) {
  return normalizeStats(stats).losses;
}

export function getAbandons(stats) {
  return normalizeStats(stats).abandons;
}

export function getWinRate(stats) {
  const total = getTotalGames(stats);
  return total ? getWins(stats) / total : 0;
}

// Merge two stats buckets (e.g. ranked "all" + "unranked") into one combined object.
// Each bucket has shape: { totalGames, wins: {count,total}, abandons: {count,total},
//   bySetup: { key: statsObj }, byRole: { key: statsObj }, byAlignment: { key: statsObj } }
export function mergeStatsBuckets(a, b) {
  if (!a && !b) return {};
  if (!a) return b;
  if (!b) return a;

  const sumCountTotal = (x, y) => ({
    count: (x?.count || 0) + (y?.count || 0),
    total: (x?.total || 0) + (y?.total || 0),
  });

  const mergeMaps = (mapA, mapB) => {
    if (!mapA && !mapB) return {};
    if (!mapA) return { ...mapB };
    if (!mapB) return { ...mapA };
    const result = { ...mapA };
    for (const key of Object.keys(mapB)) {
      if (result[key]) {
        result[key] = {
          totalGames: (result[key].totalGames || 0) + (mapB[key].totalGames || 0),
          wins: sumCountTotal(result[key].wins, mapB[key].wins),
          abandons: sumCountTotal(result[key].abandons, mapB[key].abandons),
        };
      } else {
        result[key] = { ...mapB[key] };
      }
    }
    return result;
  };

  return {
    totalGames: (a.totalGames || 0) + (b.totalGames || 0),
    wins: sumCountTotal(a.wins, b.wins),
    abandons: sumCountTotal(a.abandons, b.abandons),
    bySetup: mergeMaps(a.bySetup, b.bySetup),
    byRole: mergeMaps(a.byRole, b.byRole),
    byAlignment: mergeMaps(a.byAlignment, b.byAlignment),
  };
}
