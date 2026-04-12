// Helpers for reading Mafia per-player stats.
// Stats layout: { wins: { count, total }, abandons: { count, total }, ... }
// - wins.total = games the player finished (win or loss)
// - wins.count = games the player won
// - abandons.count = games the player abandoned mid-game

export function getTotalGames(stats) {
  return (stats?.wins?.total || 0) + (stats?.abandons?.count || 0);
}

export function getWins(stats) {
  return stats?.wins?.count || 0;
}

export function getLosses(stats) {
  return (stats?.wins?.total || 0) - (stats?.wins?.count || 0);
}

export function getAbandons(stats) {
  return stats?.abandons?.count || 0;
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
