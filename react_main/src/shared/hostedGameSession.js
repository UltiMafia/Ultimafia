// Identity of the hosted game session.
//
// Main keeps one game session mounted across site navigation. The session's
// join intent (?spectate=true / ?bot) is captured when it is first mounted, so
// entering the same game again with a different intent must replace it. A
// lobby row click says so explicitly through this navigation state; ordinary
// links to the same game (reports, the in-game warning) keep the current
// session.
export const FRESH_GAME_SESSION_STATE = { freshGameSession: true };

export function isFreshGameSession(state) {
  return !!(state && state.freshGameSession);
}

// Returns the session that should be hosted for the current game route.
// entryKey is the router history key: a fresh intent replaces the session once
// for that entry, and going Back to an already-hosted entry does not replace
// it again.
export function nextHostedGame(
  current,
  { gameId, search, entryKey, fresh = false }
) {
  if (!gameId) return current;

  if (!current || current.id !== gameId) {
    return { id: gameId, search, entryKey };
  }

  if (fresh && current.entryKey !== entryKey) {
    return { id: gameId, search, entryKey };
  }

  return current;
}

// Changing this key remounts Game, which closes the old socket and joins with
// the new intent. It is stable while the same session stays hosted.
export function hostedGameKey(game) {
  return game ? `${game.id}:${game.entryKey || ""}` : null;
}
