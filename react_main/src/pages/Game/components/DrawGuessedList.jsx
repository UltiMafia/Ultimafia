import React, { useState } from "react";

/**
 * "Already Guessed" sidebar panel for Draw It.
 *
 * Just an informational list of who has correctly guessed this turn. There's
 * no separate chat — post-guess speech is filtered inside the Village
 * meeting itself by the server (DrawItGame.preprocessMessage).
 *
 * Visible to:
 *   - The drawer during Draw (so they can see who has solved it)
 *   - Any guesser who has correctly guessed (so they see fellow guessers)
 *   - Everyone during Reveal (the round's outcome is public)
 *
 * Props:
 *   guessers: string[] — names of players who have guessed correctly this turn (in order)
 *   me: { name } | null — the current player object
 *   stateName: string — current game state ("Pick" | "Draw" | "Reveal" | ...)
 *   isDrawer: boolean — whether the current player is the drawer this turn
 */
export default function DrawGuessedList({
  guessers = [],
  me,
  stateName,
  isDrawer,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const myName = me && me.name;
  const visible =
    stateName === "Reveal" ||
    (Array.isArray(guessers) && myName && guessers.includes(myName)) ||
    (stateName === "Draw" && isDrawer);

  if (!visible) return null;

  return (
    <div className="draw-guessed-list">
      <button
        type="button"
        className="draw-guessed-list-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="draw-guessed-list-caret">
          {collapsed ? "▶" : "▼"}
        </span>{" "}
        Already Guessed ({guessers.length})
      </button>
      {!collapsed && (
        <ul className="draw-guessed-list-items">
          {guessers.length === 0 ? (
            <li className="draw-guessed-list-empty">No one yet</li>
          ) : (
            guessers.map((g, i) => (
              <li key={`${g}-${i}`} className="draw-guessed-list-row">
                <span className="draw-guessed-list-rank">{i + 1}.</span> {g}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
