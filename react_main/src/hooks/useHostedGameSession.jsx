import { useCallback, useEffect, useRef, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";

import {
  hostedGameKey,
  isFreshGameSession,
  isMembershipUpdate,
  nextHostedGame,
  requestedMembership,
} from "../shared/hostedGameSession";

export function gameIdAt(pathname) {
  return matchPath({ path: "/game/:gameId", end: false }, pathname)?.params.gameId || null;
}

// Browser navigation selects visibility; it does not own session lifetime.
export function useHostedGameSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeGameId = gameIdAt(location.pathname);
  const inGame = Boolean(routeGameId);
  const previousSite = useRef(location);
  const gameReturnLocations = useRef(new Map());
  if (!inGame) {
    previousSite.current = location;
  } else {
    // Back/Forward restores an existing game entry, including the site it was
    // entered from, rather than the page we just browsed while in that game.
    if (!gameReturnLocations.current.has(location.key)) {
      gameReturnLocations.current.set(location.key, previousSite.current);
    }
    previousSite.current = gameReturnLocations.current.get(location.key);
  }
  const activeRef = useRef(inGame);
  activeRef.current = inGame;
  const [hostedGame, setHostedGame] = useState(null);
  const freshSession = isFreshGameSession(location.state);
  const requested = requestedMembership(location.state);
  const updateMembership = isMembershipUpdate(location.state);

  useEffect(() => {
    if (!routeGameId) return;
    // Capture the entry URL before the lazy game mounts or authenticates. Site
    // navigation must not change whether this session joins as a spectator/bot.
    // A lobby row click can explicitly request a fresh session, which is how
    // the same game is entered again with the other join intent without a
    // document reload. Returning to the same game entry keeps its state.
    setHostedGame(current =>
      nextHostedGame(current, {
        gameId: routeGameId,
        search: location.search,
        entryKey: location.key,
        fresh: freshSession,
        requested,
        membershipUpdate: updateMembership,
      })
    );
  }, [
    routeGameId,
    location.search,
    location.key,
    freshSession,
    requested,
    updateMembership,
  ]);

  // The Game reports the role the server actually confirmed. This does not
  // change the session key, so a confirmed role never remounts the game. A
  // matching pending request is finished.
  const setHostedGameMembership = useCallback((membership) => {
    setHostedGame(current => {
      if (!current) return current;
      const request =
        current.request && current.request.membership === membership
          ? null
          : current.request;
      if (current.membership === membership && current.request === request)
        return current;
      return { ...current, membership, request };
    });
  }, []);

  const clearMembershipRequest = useCallback((nonce) => {
    setHostedGame(current =>
      current && current.request && current.request.nonce === nonce
        ? { ...current, request: null }
        : current
    );
  }, []);

  const leaveGameSession = useCallback(() => {
    setHostedGame(null);
    if (!activeRef.current) return;
    const previous = previousSite.current;
    navigate(gameIdAt(previous.pathname) ? "/play" : {
      pathname: previous.pathname,
      search: previous.search,
      hash: previous.hash,
    }, { replace: true, state: previous.state });
  }, [navigate]);

  return {
    inGame,
    hostedGameId: hostedGame?.id || null,
    hostedGameSearch: hostedGame?.search || "",
    hostedGameKey: hostedGameKey(hostedGame),
    hostedGameMembership: hostedGame?.membership || null,
    membershipRequest: hostedGame?.request || null,
    setHostedGameMembership,
    clearMembershipRequest,
    leaveGameSession,
  };
}
