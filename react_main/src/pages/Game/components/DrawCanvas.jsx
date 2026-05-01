import React, { useEffect, useRef, useState, useCallback } from "react";
import "./DrawCanvas.css";

const LOGICAL_W = 800;
const LOGICAL_H = 600;
const EMIT_INTERVAL_MS = 33; // ~30Hz

let strokeCounter = 0;
function nextStrokeId() {
  strokeCounter++;
  return `s${Date.now().toString(36)}-${strokeCounter}`;
}

/**
 * mode: "drawer" | "viewer" | "replay"
 * socket: socket.io client (required for drawer + viewer; not used in replay)
 * initialStrokes: [{id, color, size, mode, points: [[x,y], ...]}]
 * For drawer mode:
 *   color, size, eraseMode — props from DrawTools
 * For replay mode:
 *   strokes (full list), playhead (0..total points across all strokes; integer)
 */
export default function DrawCanvas({
  mode,
  socket,
  initialStrokes,
  color,
  size,
  eraseMode,
  strokes: replayStrokes,
  playhead,
}) {
  const canvasRef = useRef(null);
  const strokesRef = useRef(initialStrokes ? [...initialStrokes] : []);
  const currentStrokeRef = useRef(null);
  const pendingPointsRef = useRef([]);
  const lastEmitRef = useRef(0);
  const [, forceRender] = useState(0);

  // Render the canvas from strokesRef (full redraw each call).
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // In replay mode, `playhead` caps the number of points drawn across all
    // strokes. If undefined or Infinity, render the full drawing.
    let pointBudget =
      mode === "replay"
        ? playhead === undefined || playhead === Infinity
          ? Infinity
          : playhead
        : Infinity;
    let drawn = 0;
    for (const stroke of strokesRef.current) {
      if (mode === "replay" && drawn >= pointBudget) break;
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;
      if (stroke.mode === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }

      const limit = mode === "replay"
        ? Math.min(stroke.points.length, Math.max(0, pointBudget - drawn))
        : stroke.points.length;

      ctx.beginPath();
      const [x0, y0] = stroke.points[0];
      ctx.moveTo(x0, y0);
      for (let i = 1; i < limit; i++) {
        const [x, y] = stroke.points[i];
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      drawn += stroke.points.length;
    }

    ctx.globalCompositeOperation = "source-over";
  }, [mode, playhead]);

  // Replay-mode rendering: draw the supplied strokes (up to `playhead`)
  // directly into the canvas. Self-contained so it doesn't race with the
  // `redraw` useCallback or the `strokesRef` initializer — both of which
  // could leave the canvas blank when the parent swaps in a new turn's
  // strokes (the postgame "Drawings replay" use case).
  useEffect(() => {
    if (mode !== "replay") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    const strokes = Array.isArray(replayStrokes) ? replayStrokes : [];
    const pointBudget =
      playhead === undefined || playhead === Infinity ? Infinity : playhead;
    let drawn = 0;

    for (const stroke of strokes) {
      if (drawn >= pointBudget) break;
      if (!stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) continue;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;
      if (stroke.mode === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }

      const limit = Math.min(
        stroke.points.length,
        Math.max(0, pointBudget - drawn)
      );

      ctx.beginPath();
      const [x0, y0] = stroke.points[0];
      ctx.moveTo(x0, y0);
      for (let i = 1; i < limit; i++) {
        const [x, y] = stroke.points[i];
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      drawn += stroke.points.length;
    }

    ctx.globalCompositeOperation = "source-over";
    // Keep strokesRef in sync for any external reads (none in replay today).
    strokesRef.current = strokes;
  }, [mode, replayStrokes, playhead]);

  // Sync initialStrokes -> strokesRef on state transitions. extraInfo.strokes
  // is stable within a state, so this only fires when the engine ships a new
  // state (e.g. Reveal -> Pick clears strokes via beginPickState), wiping the
  // previous turn's drawing for everyone before the next turn begins.
  useEffect(() => {
    if (mode === "replay") return;
    strokesRef.current = initialStrokes ? [...initialStrokes] : [];
    redraw();
  }, [mode, initialStrokes, redraw]);

  // Initial draw
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Subscribe to server events (viewer + drawer for canvasState)
  useEffect(() => {
    if (!socket || mode === "replay") return;

    const onDelta = (delta) => {
      if (delta.type === "strokePoints") {
        let stroke = strokesRef.current.find((s) => s.id === delta.strokeId);
        if (!stroke) {
          stroke = {
            id: delta.strokeId,
            color: delta.color,
            size: delta.size,
            mode: delta.mode,
            points: [],
          };
          strokesRef.current.push(stroke);
        }
        if (Array.isArray(delta.points)) stroke.points.push(...delta.points);
      } else if (delta.type === "endStroke") {
        // no-op for client; we don't track sealed state here
      } else if (delta.type === "undo") {
        strokesRef.current = strokesRef.current.filter((s) => s.id !== delta.strokeId);
        // Fallback: if id-match found nothing, just pop.
        if (strokesRef.current.length === (initialStrokes?.length || 0)) {
          strokesRef.current.pop();
        }
      } else if (delta.type === "clearCanvas") {
        strokesRef.current = [];
      }
      redraw();
    };

    const onCanvasState = (payload) => {
      strokesRef.current = (payload && payload.strokes) ? [...payload.strokes] : [];
      redraw();
    };

    // The project's custom Socket has no per-listener removal; use a flag
    // so stale callbacks no-op after this effect tears down.
    let active = true;
    socket.on("drawDelta", (delta) => { if (active) onDelta(delta); });
    socket.on("canvasState", (payload) => { if (active) onCanvasState(payload); });
    return () => { active = false; };
  }, [socket, mode, redraw, initialStrokes]);

  // Drawer-mode pointer handlers
  const toLogical = useCallback((evt) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * LOGICAL_W;
    const y = ((evt.clientY - rect.top) / rect.height) * LOGICAL_H;
    return [
      Math.max(0, Math.min(LOGICAL_W, x)),
      Math.max(0, Math.min(LOGICAL_H, y)),
    ];
  }, []);

  const flushPending = useCallback(() => {
    if (!socket) return;
    const pending = pendingPointsRef.current;
    if (pending.length === 0 || !currentStrokeRef.current) return;
    const stroke = currentStrokeRef.current;
    socket.send("drawStroke", {
      strokeId: stroke.id,
      color: stroke.color,
      size: stroke.size,
      mode: stroke.mode,
      points: pending,
    });
    pendingPointsRef.current = [];
    lastEmitRef.current = Date.now();
  }, [socket]);

  const onPointerDown = useCallback((evt) => {
    if (mode !== "drawer") return;
    evt.preventDefault();
    try { evt.target.setPointerCapture(evt.pointerId); } catch {}
    const pt = toLogical(evt);
    const stroke = {
      id: nextStrokeId(),
      color: eraseMode ? "#ffffff" : color,
      size,
      mode: eraseMode ? "erase" : "draw",
      points: [pt],
    };
    currentStrokeRef.current = stroke;
    strokesRef.current.push(stroke);
    pendingPointsRef.current = [pt];
    lastEmitRef.current = Date.now();
    // Emit immediately so viewers see the start
    flushPending();
    redraw();
  }, [mode, eraseMode, color, size, toLogical, flushPending, redraw]);

  const onPointerMove = useCallback((evt) => {
    if (mode !== "drawer" || !currentStrokeRef.current) return;
    evt.preventDefault();
    const pt = toLogical(evt);
    currentStrokeRef.current.points.push(pt);
    pendingPointsRef.current.push(pt);
    redraw();
    if (Date.now() - lastEmitRef.current >= EMIT_INTERVAL_MS) {
      flushPending();
    }
  }, [mode, toLogical, flushPending, redraw]);

  const onPointerUp = useCallback((evt) => {
    if (mode !== "drawer" || !currentStrokeRef.current) return;
    evt.preventDefault();
    flushPending();
    const stroke = currentStrokeRef.current;
    if (socket) socket.send("endStroke", { strokeId: stroke.id });
    currentStrokeRef.current = null;
    pendingPointsRef.current = [];
  }, [mode, flushPending, socket]);

  return (
    <canvas
      ref={canvasRef}
      className={`draw-canvas draw-canvas-${mode}`}
      width={LOGICAL_W}
      height={LOGICAL_H}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}

// Imperative helpers for drawer parent component to call
export function emitUndo(socket) {
  if (socket) socket.send("undoStroke");
}
export function emitClear(socket) {
  if (socket) socket.send("clearCanvas");
}
