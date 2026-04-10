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
