// Identity of the hosted game session.
//
// Main keeps one game session mounted across site navigation. The session's
// join intent (?spectate=true / ?bot) is captured when it is first mounted, so
// entering a different game replaces it. A lobby Join/Spectate click for the
// game already hosted does not replace it: it records a role-change request
// that the mounted Game sends over its existing socket. Ordinary links to the
// same game (reports, the in-game warning) keep the current session. A
// server-confirmed membership change rewrites the URL without replacing the
// session either.
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

// Which socket action changes the confirmed role to the requested one.
export function membershipSwitch(current, requested) {
  if (!requested || current === requested) return null;
  return requested === "spectator" ? "spectate" : "takeSeat";
}

// Returns the session that should be hosted for the current game route.
// entryKey is the router history key. A fresh click for a different game
// replaces the session. A fresh click for the game already hosted either keeps
// it (the requested role already matches) or records a pending role switch for
// the mounted Game. A membership update from the server changes only the
// stored search, so neither path changes the session key or remounts Game.
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
      request:
        fresh && requested
          ? { membership: requested, nonce: entryKey }
          : null,
    };
  }

  if (fresh && current.entryKey !== entryKey) {
    if (requested && current.membership === requested) {
      return current.search === search && !current.request
        ? current
        : { ...current, search, request: null };
    }
    if (requested) {
      return {
        ...current,
        search,
        request: { membership: requested, nonce: entryKey },
      };
    }
    return {
      id: gameId,
      search,
      entryKey,
      membership: membershipFromSearch(search),
      request: null,
    };
  }

  return current;
}

// Changing this key remounts Game, which closes the old socket and joins with
// the new intent. It is stable while the same session stays hosted.
export function hostedGameKey(game) {
  return game ? `${game.id}:${game.entryKey || ""}` : null;
}
