import React from "react";
import "./DrawTools.css";

// Palette tuned for legibility on the white canvas. Pure primaries (#ff0000,
// #ffff00, #00ff00, #00ffff, #ff00ff) wash out badly; darker/saturated tones
// — roughly Material 700 — keep their identity at any brush size. Yellow is
// kept slightly brighter (amber, not mustard) since the user finds the deep
// version too dim.
const PALETTE = [
  "#000000", "#ffffff", "#616161", "#6d4c41",
  "#d32f2f", "#ef6c00", "#f9a825", "#2e7d32",
  "#00838f", "#1565c0", "#6a1b9a", "#ad1457",
];

const SIZES = [
  { key: "S", val: 10 },
  { key: "M", val: 25 },
  { key: "L", val: 40 },
];

export default function DrawTools({
  color,
  size,
  eraseMode,
  onColor,
  onSize,
  onErase,
  onClear,
  onUndo,
  hidden,
}) {
  return (
    <div
      className="draw-tools"
      style={hidden ? { visibility: "hidden", pointerEvents: "none" } : undefined}
    >
      <div className="draw-tools-palette">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={
              "draw-tools-color" +
              (c === color && !eraseMode ? " active" : "")
            }
            style={{ background: c }}
            onClick={() => {
              onColor(c);
              onErase(false);
            }}
            aria-label={`color ${c}`}
          />
        ))}
      </div>
      <div className="draw-tools-brushes">
        <div className="draw-tools-brushes-left">
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={
                "draw-tools-size" + (size === s.val ? " active" : "")
              }
              onClick={() => onSize(s.val)}
              aria-label={`brush ${s.key}`}
              title={`${s.key} (${s.val}px)`}
            >
              <span
                className="draw-tools-size-dot"
                style={{
                  // Raw brush size — no clamp. The previous Math.min(s.val,22)
                  // collapsed M (25) and L (40) to the same 22px dot, making
                  // the three sizes look identical on mobile.
                  width: s.val,
                  height: s.val,
                  background: eraseMode ? "#ffffff" : color,
                }}
              />
            </button>
          ))}
          <button
            type="button"
            className={
              "draw-tools-erase" + (eraseMode ? " active" : "")
            }
            onClick={() => onErase(!eraseMode)}
            aria-label="eraser"
            title="Eraser"
          >
            <span className="draw-tools-erase-icon" />
          </button>
        </div>
        <div className="draw-tools-brushes-right">
          <button type="button" className="draw-tools-undo" onClick={onUndo}>
            Undo
          </button>
          <button
            type="button"
            className="draw-tools-clear"
            onClick={() => {
              if (window.confirm("Clear the canvas?")) onClear();
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
