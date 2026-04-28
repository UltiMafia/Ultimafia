import React from "react";

/**
 * Word display banner for Draw It.
 *
 * Props:
 *   isDrawer: boolean — current player is the drawer
 *   stateName: "Pick" | "Draw" | "Reveal" | other
 *   currentWord: string | null — the word the drawer is drawing (only the drawer should know this)
 *   wordLength: number | null — length to render as blanks for guessers
 *   revealedWord: string | null — used during Reveal to show the answer to everyone
 */
export default function WordDisplay({
  isDrawer,
  stateName,
  currentWord,
  wordLength,
  revealedWord,
}) {
  if (stateName === "Reveal" && revealedWord) {
    return (
      <div className="draw-word-display draw-word-display-reveal">
        Word was: <strong>{revealedWord}</strong>
      </div>
    );
  }

  if (stateName === "Pick") {
    if (isDrawer) {
      // Drawer sees the meeting widget; no banner needed.
      return null;
    }
    return (
      <div className="draw-word-display">Drawer is choosing a word…</div>
    );
  }

  if (isDrawer && currentWord) {
    return (
      <div className="draw-word-display">
        Word: <strong>{currentWord}</strong>
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

  return <div className="draw-word-display">&nbsp;</div>;
}
