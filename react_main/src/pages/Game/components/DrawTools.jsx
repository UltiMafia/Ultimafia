import React from "react";
import "./DrawTools.css";

const PALETTE = [
  "#000000", "#ffffff", "#7f7f7f", "#8b4513",
  "#ff0000", "#ff7f00", "#ffff00", "#00ff00",
  "#00ffff", "#0000ff", "#7f00ff", "#ff00ff",
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
                  width: Math.min(s.val, 22),
                  height: Math.min(s.val, 22),
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
