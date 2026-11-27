import { useEffect } from "react";
import { isSpeechFilterShortcut } from "utils/speechFilters";

// Ctrl+F / Cmd+F opens the game's speech filter panel. Bound only by the
// active game session, so a retained session on another page does not swallow
// the browser's own find shortcut.
export function useSpeechFilterShortcut(active, onOpen) {
  useEffect(() => {
    if (!active) return undefined;

    function onKeyDown(event) {
      if (!isSpeechFilterShortcut(event)) return;
      event.preventDefault();
      onOpen();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onOpen]);
}
