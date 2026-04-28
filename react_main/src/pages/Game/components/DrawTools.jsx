import React from "react";
import "./DrawTools.css";

const PALETTE = [
  "#000000", "#ffffff", "#7f7f7f", "#8b4513",
  "#ff0000", "#ff7f00", "#ffff00", "#00ff00",
  "#00ffff", "#0000ff", "#7f00ff", "#ff00ff",
];

const SIZES = [
  { key: "S", val: 3 },
  { key: "M", val: 10 },
  { key: "L", val: 15 },
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
  disabled,
}) {
  if (disabled) return null;

  return (
    <div className="draw-tools">
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
        {SIZES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={
              "draw-tools-size" +
              (size === s.val ? " active" : "")
            }
            onClick={() => onSize(s.val)}
            aria-label={`brush ${s.key}`}
            title={`${s.key} (${s.val}px)`}
          >
            <span
              className="draw-tools-size-dot"
              style={{ width: s.val * 2, height: s.val * 2 }}
            />
          </button>
        ))}
        <button
          type="button"
          className={
            "draw-tools-erase" + (eraseMode ? " active" : "")
          }
          onClick={() => onErase(!eraseMode)}
        >
          Erase
        </button>
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
  );
}
