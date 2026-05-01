const TIER = [10, 8, 6, 4, 2, 1];

function guesserScore(rank) {
  return TIER[rank] != null ? TIER[rank] : 1;
}

function drawerScore(guesserRanks) {
  if (guesserRanks.length === 0) return 0;
  const sum = guesserRanks.reduce((acc, r) => acc + guesserScore(r), 0);
  return Math.round(sum / guesserRanks.length);
}

module.exports = { guesserScore, drawerScore };
