import { useContext, useEffect, useRef } from "react";
import { UserContext } from "../Contexts";
import { subscribeSocketListeners } from "../Socket";

export function useGameMembership(socket, gameId, enabled = true) {
  const { refreshGameMembership, refreshHearts, setInGame } = useContext(UserContext);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  useEffect(() => {
    if (!enabled) return;
    return subscribeSocketListeners(socket, scoped => {
      scoped.on("loaded", () => {
        if (enabledRef.current) refreshGameMembership();
      });
      const refreshBalance = () => {
        if (enabledRef.current) refreshHearts();
      };
      scoped.on("start", refreshBalance);
      scoped.on("takeSeatFailed", refreshBalance);
      // Options change when integrity is lost; the balance-only reconciliation
      // also runs periodically if the refund finishes after this event.
      scoped.on("options", refreshBalance);
      const clearMatching = () => {
        if (enabledRef.current) {
          setInGame(current => current === gameId ? null : current);
          refreshHearts();
        }
      };
      // finished precedes Redis cleanup. Refresh balances, never membership here.
      scoped.on("finished", clearMatching);
      scoped.on("left", clearMatching);
    });
  }, [socket, gameId, refreshGameMembership, refreshHearts, setInGame, enabled]);
}
