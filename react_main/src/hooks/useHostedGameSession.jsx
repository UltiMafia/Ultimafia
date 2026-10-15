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
  if (!inGame) previousSite.current = location;
  const activeRef = useRef(inGame);
  activeRef.current = inGame;
  const [hostedGameId, setHostedGameId] = useState(null);

  useEffect(() => {
    if (routeGameId) setHostedGameId(routeGameId);
  }, [routeGameId]);

  const leaveGameSession = useCallback(() => {
    setHostedGameId(null);
    if (!activeRef.current) return;
    const previous = previousSite.current;
    navigate(gameIdAt(previous.pathname) ? "/play" : {
      pathname: previous.pathname,
      search: previous.search,
      hash: previous.hash,
    }, { replace: true, state: previous.state });
  }, [navigate]);

  return { inGame, hostedGameId, leaveGameSession };
}
