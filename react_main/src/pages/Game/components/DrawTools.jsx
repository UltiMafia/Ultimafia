import React, { useEffect, useState } from "react";
import { UiAction, UiDialog } from "components/ui";
import { useViewActive } from "../../../hooks/useViewActivity";
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
  const active = useViewActive();
  const available = active && !hidden;
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (!available) setConfirmClear(false);
  }, [available]);

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
            disabled={!available}
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
            aria-pressed={c === color && !eraseMode}
          />
        ))}
      </div>
      <div className="draw-tools-brushes">
        <div className="draw-tools-brushes-left">
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              disabled={!available}
              className={
                "draw-tools-size" + (size === s.val ? " active" : "")
              }
              onClick={() => onSize(s.val)}
              aria-label={`brush ${s.key}`}
              aria-pressed={size === s.val}
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
            disabled={!available}
            className={
              "draw-tools-erase" + (eraseMode ? " active" : "")
            }
            onClick={() => onErase(!eraseMode)}
            aria-label="eraser"
            aria-pressed={eraseMode}
            title="Eraser"
          >
            <span className="draw-tools-erase-icon" />
          </button>
        </div>
        <div className="draw-tools-brushes-right">
          <UiAction disabled={!available} onClick={() => { if (available) onUndo(); }}>
            Undo
          </UiAction>
          <UiAction disabled={!available} onClick={() => { if (available) setConfirmClear(true); }}
          >
            Clear
          </UiAction>
        </div>
      </div>
      {available && confirmClear && <UiDialog title="Clear the canvas?" onClose={() => setConfirmClear(false)}
        actions={<>
          <UiAction onClick={() => setConfirmClear(false)}>Cancel</UiAction>
          <UiAction variant="danger" onClick={() => {
            if (!available || !confirmClear) return;
            setConfirmClear(false);
            onClear();
          }}>Clear canvas</UiAction>
        </>}>
        <p>Remove all strokes from the current drawing?</p>
      </UiDialog>}
    </div>
  );
}
