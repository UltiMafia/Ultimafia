import React, { useState } from "react";

/**
 * Header / collapsible wrapper for the Draw It "Already Guessed" panel.
 *
 * The actual chat messages flow through the existing meeting-message
 * infrastructure (the SecretChat meeting on the server). This component
 * is a label/wrapper rendered next to the common chat in the right panel.
 *
 * Props:
 *   guessers: string[] — names of players who have guessed correctly this turn (in order)
 *   me: { name } | null — the current player object
 *   stateName: string — current game state ("Pick" | "Draw" | "Reveal" | ...)
 */
export default function DrawSecretChat({ guessers = [], me, stateName }) {
  const [collapsed, setCollapsed] = useState(false);

  const myName = me && me.name;
  const visible =
    stateName === "Reveal" ||
    (Array.isArray(guessers) && myName && guessers.includes(myName));

  if (!visible) return null;

  return (
    <div className="draw-secret-chat">
      <button
        type="button"
        className="draw-secret-chat-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="draw-secret-chat-caret">
          {collapsed ? "▶" : "▼"}
        </span>{" "}
        Already Guessed ({guessers.length})
      </button>
      {!collapsed && (
        <ul className="draw-secret-chat-list">
          {guessers.length === 0 ? (
            <li className="draw-secret-chat-empty">No one yet</li>
          ) : (
            guessers.map((g, i) => (
              <li key={`${g}-${i}`} className="draw-secret-chat-row">
                <span className="draw-secret-chat-rank">{i + 1}.</span> {g}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
