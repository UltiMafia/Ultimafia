import React, { useContext, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useSocketListeners } from "./Game";
import { SiteInfoContext } from "../../Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import foodImage from "../../images/minigames/battlesnakes_food.png";

const SWIPE_THRESHOLD_PX = 30;

// Helper: Assign each player a unique color (supports up to 10+ players)
function snakeColor(index) {
  const palette = d3.schemeCategory10.concat(d3.schemeSet3);
  return palette[index % palette.length];
}

// Converts grid (x, y) to pixel positions
function cellToPx(cell, cellSize) {
  return cell * cellSize;
}

/**
 * Props:
 *   - playerId: string (your own player id)
 *   - connect: function(onGameState, onPlayerId): called to connect to backend.
 *              Calls onGameState(state) with latest state,
 *              calls onPlayerId(id) when player id assigned.
 */
export default function SnakeGameDisplay({ player, players, gameSocket, extraInfo }) {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(player || -1);
  const svgRef = useRef();
  const [cellSize, setCellSize] = useState(24); // pixels per grid square
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();
  const [dpadCollapsed, setDpadCollapsed] = useState(false);
  const [wrapView, setWrapView] = useState(false);
  const touchStartRef = useRef(null);

  const wallsTransparent = gameState?.ifWallsAreTransparent !== false;
  // Camera-follow mode: always on for mobile, opt-in toggle for desktop.
  const followView = isPhoneDevice || wrapView;

  function sendMove(dir) {
    if (!gameSocket?.send) return;
    gameSocket.send("move", dir);
  }

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e) {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      sendMove(dx > 0 ? "right" : "left");
    } else {
      sendMove(dy > 0 ? "down" : "up");
    }
  }

  useSocketListeners((socket) => {
    socket.on("gameState", (state) => {
      setGameState(state);
    });
  }, gameSocket || {});

  // Use extraInfo from history when in review mode or postgame
  useEffect(() => {
    if (extraInfo?.snakes) {
      setGameState({
        snakes: extraInfo.snakes,
        foods: extraInfo.foods,
        gridSize: extraInfo.gridSize,
      });
    }
  }, [extraInfo]);

  useEffect(() => {
    if (gameSocket || extraInfo) return;

    let demoPlayerId = "you";
    setPlayerId(demoPlayerId);
    let otherId = "other";
    let demoState = {
      gridSize: 20,
      snakes: {
        [demoPlayerId]: {
          direction: "right",
          segments: [
            { x: 2, y: 10 },
            { x: 1, y: 10 },
            { x: 0, y: 10 },
          ],
          alive: true,
        },
        [otherId]: {
          direction: "down",
          segments: [
            { x: 6, y: 12 },
            { x: 6, y: 11 },
            { x: 6, y: 10 },
          ],
          alive: true,
        },
      },
      food: { x: 12, y: 8 },
      foods: [
        { x: 12, y: 8 },
        { x: 5, y: 5 },
      ],
    };
    let tick = 0;
    const intv = setInterval(() => {
      demoState.snakes[demoPlayerId].segments = demoState.snakes[
        demoPlayerId
      ].segments.map((s) => ({ ...s, x: s.x + 1 }));
      demoState.food.x = (demoState.food.x + 1) % demoState.gridSize;
      demoState.foods.forEach((f, i) => {
        f.x = (f.x + 1 + i) % demoState.gridSize;
      });
      setGameState({ ...demoState });
      tick += 1;
    }, 400);
    return () => clearInterval(intv);
  }, [gameSocket, extraInfo]);

  useEffect(() => {
    if (!gameState) return;

    const gridSize = gameState.gridSize || 20;
    const boardPx = gridSize * cellSize;

    // Tile offsets to replicate entities across — one tile when walls are
    // solid, a 3×3 set when walls wrap so the player sees what's coming
    // around the edge.
    const tileOffsets = wallsTransparent
      ? [
          [-boardPx, -boardPx], [0, -boardPx], [boardPx, -boardPx],
          [-boardPx, 0], [0, 0], [boardPx, 0],
          [-boardPx, boardPx], [0, boardPx], [boardPx, boardPx],
        ]
      : [[0, 0]];

    // Camera-follow window centered on the player's snake head.
    let viewX = 0;
    let viewY = 0;
    let viewSize = boardPx;
    let displaySize = boardPx;

    const playerSnake =
      playerId !== -1 && gameState.snakes && gameState.snakes[playerId];
    const head = playerSnake?.segments?.[0];

    if (followView) {
      const containerCap = isPhoneDevice
        ? window.innerWidth - 64
        : Math.min(window.innerWidth - 200, 600);
      displaySize = Math.min(boardPx, containerCap);
      const VIEWPORT_CELLS = 16;
      viewSize = Math.min(boardPx, VIEWPORT_CELLS * cellSize);
      if (head) {
        viewX = head.x * cellSize + cellSize / 2 - viewSize / 2;
        viewY = head.y * cellSize + cellSize / 2 - viewSize / 2;
        if (!wallsTransparent) {
          // Solid walls: keep the camera inside the playable area.
          viewX = Math.max(0, Math.min(viewX, boardPx - viewSize));
          viewY = Math.max(0, Math.min(viewY, boardPx - viewSize));
        }
      }
    }

    const svg = d3
      .select(svgRef.current)
      .attr("width", displaySize)
      .attr("height", displaySize)
      .attr("viewBox", `${viewX} ${viewY} ${viewSize} ${viewSize}`);

    // Map border — only meaningful for solid walls. Hidden when wrapping.
    let borderSel = svg
      .selectAll(".map-border")
      .data(followView && !wallsTransparent ? [0] : []);
    borderSel.exit().remove();
    borderSel
      .enter()
      .append("rect")
      .attr("class", "map-border")
      .attr("fill", "none")
      .attr("stroke", "#ff5252")
      .attr("stroke-width", 3)
      .merge(borderSel)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", boardPx)
      .attr("height", boardPx);

    // Gridlines extend across all rendered tiles when wrapping.
    const gridStart = wallsTransparent ? -gridSize : 0;
    const gridEndExclusive = wallsTransparent ? 2 * gridSize : gridSize;
    const lineSpan = wallsTransparent
      ? { from: -boardPx, to: 2 * boardPx }
      : { from: 0, to: boardPx };

    const vertLineData = d3.range(gridStart + 1, gridEndExclusive);
    let vertLines = svg.selectAll(".gridline-vert").data(vertLineData);
    vertLines
      .enter()
      .append("line")
      .attr("class", "gridline gridline-vert")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .merge(vertLines)
      .attr("x1", (d) => cellToPx(d, cellSize))
      .attr("x2", (d) => cellToPx(d, cellSize))
      .attr("y1", lineSpan.from)
      .attr("y2", lineSpan.to);
    vertLines.exit().remove();

    let horizLines = svg.selectAll(".gridline-horiz").data(vertLineData);
    horizLines
      .enter()
      .append("line")
      .attr("class", "gridline gridline-horiz")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .merge(horizLines)
      .attr("y1", (d) => cellToPx(d, cellSize))
      .attr("y2", (d) => cellToPx(d, cellSize))
      .attr("x1", lineSpan.from)
      .attr("x2", lineSpan.to);
    horizLines.exit().remove();

    // --- Draw Food (replicated across tiles when wrapping) ---
    const foodData = (gameState.foods || []).flatMap((f) =>
      tileOffsets.map(([dx, dy], ti) => ({
        ...f,
        _dx: dx,
        _dy: dy,
        _key: `${f.x}-${f.y}-${ti}`,
      }))
    );
    let foodSel = svg.selectAll(".food").data(foodData, (d) => d._key);
    foodSel
      .enter()
      .append("image")
      .attr("class", "food")
      .attr("href", foodImage)
      .merge(foodSel)
      .attr("x", (d) => cellToPx(d.x, cellSize) + d._dx)
      .attr("y", (d) => cellToPx(d.y, cellSize) + d._dy)
      .attr("width", cellSize)
      .attr("height", cellSize);
    foodSel.exit().remove();

    // --- Draw Snakes (replicated across tiles when wrapping) ---
    const snakePlayerIds = Object.keys(gameState.snakes || {});
    let allSegs = [];
    snakePlayerIds.forEach((id, idx) => {
      const snake = gameState.snakes[id];
      snake.segments
        .filter((se) => se.active == true)
        .forEach((s, i) => {
          tileOffsets.forEach(([dx, dy], ti) => {
            allSegs.push({
              ...s,
              player: id,
              index: i,
              isHead: i === 0,
              isTail: i === snake.segments.length - 1,
              dead: !snake.alive,
              _dx: dx,
              _dy: dy,
              _key: `${id}-${i}-${ti}`,
            });
          });
        });
    });

    // One color per player — use their text colour if set, otherwise fallback to palette
    const colorMap = {};
    snakePlayerIds.forEach((id, idx) => {
      const p = players && players[id];
      colorMap[id] = (p && p.textColor) || snakeColor(idx);
    });

    let segsSel = svg.selectAll(".snake-seg").data(allSegs, (d) => d._key);
    segsSel
      .enter()
      .append("rect")
      .attr("class", "snake-seg")
      .merge(segsSel)
      .attr("x", (d) => cellToPx(d.x, cellSize) + d._dx)
      .attr("y", (d) => cellToPx(d.y, cellSize) + d._dy)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d) => (d.dead ? "#555" : colorMap[d.player]))
      .attr("stroke", (d) => (d.isHead ? "#fff" : "#222"))
      .attr("stroke-width", (d) => (d.isHead ? 3 : 1))
      .attr("opacity", (d) => (d.isTail ? 0.8 : 1));
    segsSel.exit().remove();

    // Highlight your snake with thick outline
    svg
      .selectAll(".snake-seg")
      .attr("filter", (d) =>
        d.player === playerId && d.isHead ? "drop-shadow(0 0 4px #fff)" : null
      );

    // --- Draw player avatars at snake heads ---
    let headData = [];
    snakePlayerIds.forEach((id, idx) => {
      const snake = gameState.snakes[id];
      if (snake.segments.length > 0) {
        const p = players && players[id];
        const hasAvatar = p && p.avatar && p.userId;
        headData.push({
          x: snake.segments[0].x,
          y: snake.segments[0].y,
          id,
          name: p && p.name ? p.name : `Player ${idx + 1}`,
          avatarUrl: hasAvatar
            ? `/uploads/${p.userId}_avatar.webp${siteInfo ? `?t=${siteInfo.cacheVal}` : ""}`
            : null,
        });
      }
    });

    // Remove old avatars before redrawing
    svg.selectAll(".snake-avatar").remove();

    // Draw avatar images on heads (replicated across tiles when wrapping)
    headData.forEach((d) => {
      if (!d.avatarUrl) return;
      tileOffsets.forEach(([dx, dy]) => {
        svg
          .append("image")
          .attr("class", "snake-avatar")
          .attr("x", cellToPx(d.x, cellSize) + dx)
          .attr("y", cellToPx(d.y, cellSize) + dy)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("href", d.avatarUrl)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .style("pointer-events", "none");
      });
    });
  }, [gameState, cellSize, playerId, players, isPhoneDevice, followView, wallsTransparent]);

  useEffect(() => {
    if (!playerId) return;
    const keyToDir = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    function keyListener(e) {
      const val = keyToDir[e.key];
      if (val) {
        gameSocket.send("move", val);
      }
    }
    window.addEventListener("keydown", keyListener);
    return () => window.removeEventListener("keydown", keyListener);
  }, [playerId, gameSocket]);

  return (
    <div
      style={{
        background: "#181818",
        border: "2px solid #222",
        borderRadius: 8,
        width: "fit-content",
        margin: "24px auto",
        padding: "16px",
        boxShadow: "0 2px 8px #000a",
        position: "relative",
      }}
    >
      <div
        onTouchStart={isPhoneDevice ? handleTouchStart : undefined}
        onTouchEnd={isPhoneDevice ? handleTouchEnd : undefined}
        style={isPhoneDevice ? { touchAction: "none" } : undefined}
      >
        <svg ref={svgRef} />
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 10,
          color: "#ccc",
        }}
      ></div>
      {isPhoneDevice && (
        <div
          style={{ position: "absolute", bottom: 12, right: 12, zIndex: 10 }}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {dpadCollapsed ? (
            <DpadToggle expanded={false} onClick={() => setDpadCollapsed(false)} />
          ) : (
            <Dpad
              onMove={sendMove}
              onCollapse={() => setDpadCollapsed(true)}
            />
          )}
        </div>
      )}
      {!isPhoneDevice && wallsTransparent && gameState && (
        <button
          onClick={() => setWrapView((v) => !v)}
          title={wrapView ? "Exit wrap view" : "Wrap view (camera follows your snake)"}
          aria-label={wrapView ? "Exit wrap view" : "Enter wrap view"}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            background: wrapView ? "rgba(255, 152, 0, 0.85)" : "rgba(40,40,40,0.7)",
            border: "1px solid #555",
            borderRadius: 6,
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <i className="fas fa-globe" />
        </button>
      )}
    </div>
  );
}

const dpadBtnStyle = {
  width: 44,
  height: 44,
  background: "rgba(40,40,40,0.85)",
  border: "1px solid #555",
  borderRadius: 6,
  color: "#fff",
  fontSize: 16,
  cursor: "pointer",
  touchAction: "manipulation",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

function Dpad({ onMove, onCollapse }) {
  const cell = (child, key) =>
    child || <div key={key} />;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 44px 44px",
        gridTemplateRows: "44px 44px 44px",
        gap: 4,
      }}
    >
      <div />
      <button style={dpadBtnStyle} onClick={() => onMove("up")} aria-label="Up">
        <i className="fas fa-chevron-up" />
      </button>
      <button
        style={{ ...dpadBtnStyle, opacity: 0.7 }}
        onClick={onCollapse}
        aria-label="Hide controls"
      >
        <i className="fas fa-times" />
      </button>
      <button style={dpadBtnStyle} onClick={() => onMove("left")} aria-label="Left">
        <i className="fas fa-chevron-left" />
      </button>
      <div />
      <button style={dpadBtnStyle} onClick={() => onMove("right")} aria-label="Right">
        <i className="fas fa-chevron-right" />
      </button>
      <div />
      <button style={dpadBtnStyle} onClick={() => onMove("down")} aria-label="Down">
        <i className="fas fa-chevron-down" />
      </button>
      <div />
    </div>
  );
}

function DpadToggle({ onClick }) {
  return (
    <button
      style={{ ...dpadBtnStyle, opacity: 0.6 }}
      onClick={onClick}
      aria-label="Show controls"
    >
      <i className="fas fa-gamepad" />
    </button>
  );
}
