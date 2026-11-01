// Identity of the hosted game session.
//
// Main keeps one game session mounted across site navigation. The session's
// join intent (?spectate=true / ?bot) is captured when it is first mounted, so
// entering the same game again with a different membership target must replace
// it. A lobby row click says so explicitly through navigation state; ordinary
// links to the same game (reports, the in-game warning) keep the current
// session. A membership update from the server changes the URL without
// replacing the session.
export function freshGameSessionState(membership) {
  return { freshGameSession: true, requestedMembership: membership };
}

export function joinGameSessionState() {
  return freshGameSessionState("player");
}

export function spectateGameSessionState() {
  return freshGameSessionState("spectator");
}

export function isFreshGameSession(state) {
  return !!(state && state.freshGameSession);
}

export function requestedMembership(state) {
  return state && state.requestedMembership === "spectator"
    ? "spectator"
    : state && state.requestedMembership === "player"
      ? "player"
      : null;
}

export function isMembershipUpdate(state) {
  return !!(state && state.membershipUpdate);
}

export function membershipFromSearch(search) {
  return new URLSearchParams(search || "").get("spectate") === "true"
    ? "spectator"
    : "player";
}

// Returns the session that should be hosted for the current game route.
// entryKey is the router history key: a fresh intent replaces the session once
// for that entry, and going Back to an already-hosted entry does not replace
// it again. A requested membership that the server already confirmed keeps the
// mounted session and only records the new URL search.
export function nextHostedGame(
  current,
  {
    gameId,
    search,
    entryKey,
    fresh = false,
    requested = null,
    membershipUpdate = false,
  }
) {
  if (!gameId) return current;

  if (membershipUpdate && current && current.id === gameId) {
    return { ...current, search };
  }

  if (!current || current.id !== gameId) {
    return {
      id: gameId,
      search,
      entryKey,
      membership: requested || membershipFromSearch(search),
    };
  }

  if (fresh && current.entryKey !== entryKey) {
    if (requested && current.membership === requested) {
      return current.search === search ? current : { ...current, search };
    }
    return {
      id: gameId,
      search,
      entryKey,
      membership: requested || membershipFromSearch(search),
    };
  }

  return current;
}

// Changing this key remounts Game, which closes the old socket and joins with
// the new intent. It is stable while the same session stays hosted.
export function hostedGameKey(game) {
  return game ? `${game.id}:${game.entryKey || ""}` : null;
}
