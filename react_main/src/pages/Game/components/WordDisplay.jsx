import React from "react";

/**
 * Word display banner for Draw It.
 *
 * The Reveal-state showdown shows the word as a canvas overlay (see
 * DrawItGame.jsx), not in this banner — so during Reveal we render an empty
 * placeholder to keep the canvas position stable and let the overlay shine.
 *
 * Props:
 *   isDrawer: boolean — current player is the drawer
 *   stateName: "Pick" | "Draw" | "Reveal" | other
 *   currentWord: string | null — the word being drawn (drawer's overlay reads this)
 *   wordLength: number | null — length to render as blanks for guessers during Draw
 */
export default function WordDisplay({
  isDrawer,
  stateName,
  currentWord,
  wordLength,
}) {
  if (stateName === "Pick") {
    if (isDrawer) {
      // Drawer sees the picker overlaid via .draw-action-list. Reserve banner
      // height (transparent) so the canvas position stays static across states.
      return (
        <div className="draw-word-display draw-word-display-placeholder">
          &nbsp;
        </div>
      );
    }
    return (
      <div className="draw-word-display">Drawer is choosing a word…</div>
    );
  }

  if (isDrawer || stateName === "Reveal") {
    // Drawer (Draw): word is on the canvas overlay.
    // Reveal: word is on the canvas overlay for everyone.
    return (
      <div className="draw-word-display draw-word-display-placeholder">
        &nbsp;
      </div>
    );
  }

  if (wordLength) {
    return (
      <div className="draw-word-display">
        {Array(wordLength).fill("_").join(" ")}{" "}
        <span className="draw-word-length">({wordLength})</span>
      </div>
    );
  }

  return (
    <div className="draw-word-display draw-word-display-placeholder">
      &nbsp;
    </div>
  );
}
