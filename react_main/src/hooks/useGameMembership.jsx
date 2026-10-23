import { useContext, useEffect, useRef } from "react";
import { UserContext } from "../Contexts";
import { subscribeSocketListeners } from "../Socket";

export function useGameMembership(socket, gameId, enabled = true) {
  const { refreshGameMembership, setInGame } = useContext(UserContext);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  useEffect(() => {
    if (!enabled) return;
    return subscribeSocketListeners(socket, scoped => {
      scoped.on("loaded", () => {
        if (enabledRef.current) refreshGameMembership();
      });
      const clearMatching = () => {
        if (enabledRef.current) {
          setInGame(current => current === gameId ? null : current);
        }
      };
      // finished is broadcast before Redis cleanup, so do not race a lookup here.
      scoped.on("finished", clearMatching);
      scoped.on("left", clearMatching);
    });
  }, [socket, gameId, refreshGameMembership, setInGame, enabled]);
}
