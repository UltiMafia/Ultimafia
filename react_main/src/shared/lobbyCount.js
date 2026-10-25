// The lobby card shows "players/total" from the lobby list, which refreshes on
// a timer. The game info popover fetches /api/game/:id/info live, so when it
// opens the card takes the count from that response instead of showing a
// number that may be one poll old. Shared with the server-side test suite.

// Seated player count from an /info response for a game still filling up,
// or null when the response cannot be used (finished games, errors).
function lobbyCountFromInfo(info) {
  if (!info || typeof info !== "object") return null;
  if (info.status && info.status !== "Open") return null;
  if (!Array.isArray(info.players)) return null;
  return info.players.length;
}

// The count to show: the live one from the popover while it is newer than
// the list row it was fetched for, else the list's own count.
function displayedLobbyCount(listCount, live) {
  if (live && live.listCount === listCount && Number.isFinite(live.count))
    return live.count;
  return listCount || 0;
}

module.exports = { lobbyCountFromInfo, displayedLobbyCount };
