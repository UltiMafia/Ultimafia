// Helpers for /api/game/list paging. The list is the live games (open, then
// in progress) followed by finished games, cut into pages of lobbyPageSize.

// How many finished games come before the first one shown on a page that
// starts at `start`, given `liveCount` live games ahead of them.
function finishedSkip(start, liveCount) {
  return Math.max(0, start - liveCount);
}

// Keep the first game per id, in order, and drop ids already in `seenIds`
// (games listed earlier on the page). Older data can hold two Game documents
// for one id, so the finished tail may repeat an id.
function dedupeById(games, seenIds = []) {
  const seen = new Set(seenIds);
  const out = [];

  for (const game of games) {
    if (!game || seen.has(game.id)) continue;
    seen.add(game.id);
    out.push(game);
  }

  return out;
}

module.exports = { finishedSkip, dedupeById };
