import { useCallback, useEffect, useRef, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (!routeGameId) return;
    // Capture the entry URL before the lazy game mounts or authenticates. Site
    // navigation must not change whether this session joins as a spectator/bot.
    // Returning to the same game keeps both its state and its original intent.
    setHostedGame(current => current?.id === routeGameId ? current : {
      id: routeGameId,
      search: location.search,
    });
  }, [routeGameId, location.search]);

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
    leaveGameSession,
  };
}
