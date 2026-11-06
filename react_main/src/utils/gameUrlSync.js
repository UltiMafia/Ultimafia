// Where the game page should keep the URL once the session is live.
//
// The session outlives navigation: it stays mounted (hidden) while the player
// browses the site, and its effect re-asserts the URL when it becomes active
// again so a stale ?spectate=true cannot move a seated player back to the
// spectator list.
//
// That assertion has to stand down when the browser is already opening a
// different game. Otherwise, clicking "review" on another game while a review
// is still hosted rewrites the URL back to the game being reviewed: the child
// session's effect runs before the parent swaps the session, sees its own id,
// and wins the race.
export function gameUrlTarget({ routeGameId, gameId, isSpectator }) {
  if (!gameId) return null;
  // The URL names a different game: that session is taking over, leave it alone.
  if (routeGameId !== gameId) return null;

  return `/game/${gameId}${isSpectator ? "?spectate=true" : ""}`;
}
