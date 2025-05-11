import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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
export default function SnakeGameDisplay({ playerId: userPlayerId, connect }) {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(userPlayerId || null);
  const svgRef = useRef();
  const [cellSize, setCellSize] = useState(24); // pixels per grid square

  // Mock "connect" function if none is provided (for demo)
  useEffect(() => {
    if (!connect) {
      // Mock State Every 200ms for Standalone Demo Usage
      let demoPlayerId = "you";
      setPlayerId(demoPlayerId);
      let otherId = "other";
      let demoState = {
        gridSize: 20,
        snakes: {
          [demoPlayerId]: {
            direction: "right",
            segments: [ {x:2, y:10}, {x:1, y:10}, {x:0, y:10} ],
            alive: true
          },
          [otherId]: {
            direction: "down",
            segments: [ {x:6, y:12}, {x:6, y:11}, {x:6, y:10} ],
            alive: true
          }
        },
        food: { x: 12, y: 8 },
      };
      let tick = 0;
      const intv = setInterval(() => {
        // Move demo snakes for demo
        demoState.snakes[demoPlayerId].segments = demoState.snakes[demoPlayerId].segments.map(s => ({...s, x: s.x+1}));
        demoState.food.x = (demoState.food.x+1) % demoState.gridSize;
        setGameState({ ...demoState });
        tick += 1;
      }, 400);
      return () => clearInterval(intv);
    }
    // --- Real connect to backend ---
    connect(
      state => {
        setGameState(state);
        // If grid size changes, adapt svg size
        if (state.gridSize) setCellSize(Math.max(16, Math.floor(480/state.gridSize)));
      },
      id => setPlayerId(id)
    );
  }, [connect]);

  // --- Draw Game ---
  useEffect(() => {
    if (!gameState) return;

    const gridSize = gameState.gridSize || 20;
    const svg = d3.select(svgRef.current)
      .attr("width", gridSize * cellSize)
      .attr("height", gridSize * cellSize)
      .attr("viewBox", `0 0 ${gridSize*cellSize} ${gridSize*cellSize}`);

    // Draw grid lines
    let gridLines = svg.selectAll(".gridline").data(d3.range(1, gridSize));
    gridLines.enter()
      .append("line")
      .attr("class", "gridline")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .merge(gridLines)
      .attr("x1", d => cellToPx(d, cellSize))
      .attr("x2", d => cellToPx(d, cellSize))
      .attr("y1", 0)
      .attr("y2", cellToPx(gridSize, cellSize));
    gridLines.enter()
      .append("line")
      .attr("class", "gridline")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .merge(gridLines)
      .attr("y1", d => cellToPx(d, cellSize))
      .attr("y2", d => cellToPx(d, cellSize))
      .attr("x1", 0)
      .attr("x2", cellToPx(gridSize, cellSize));
    gridLines.exit().remove();

    // --- Draw Food ---
    let foodSel = svg.selectAll(".food").data([gameState.food]);
    foodSel.enter()
      .append("rect")
      .attr("class", "food")
      .attr("rx", cellSize/5)
      .attr("ry", cellSize/5)
      .merge(foodSel)
      .attr("x", d => cellToPx(d.x, cellSize))
      .attr("y", d => cellToPx(d.y, cellSize))
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", "#e83")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    foodSel.exit().remove();

    // --- Draw Snakes ---
    const snakePlayerIds = Object.keys(gameState.snakes || {});
    let allSegs = [];
    snakePlayerIds.forEach((id, idx) => {
      const snake = gameState.snakes[id];
      // For head/tail distinction
      const segs = snake.segments.map((s, i) => ({
        ...s,
        player: id,
        index: i,
        isHead: i === 0,
        isTail: i === snake.segments.length-1,
        dead: !snake.alive 
      }));
      allSegs.push(...segs);
    });

    // One color per player
    const colorMap = {};
    snakePlayerIds.forEach((id,idx) => colorMap[id] = snakeColor(idx));

    let segsSel = svg.selectAll(".snake-seg").data(allSegs, d => d.player+"-"+d.index);
    segsSel.enter()
      .append("rect")
      .attr("class", "snake-seg")
      .merge(segsSel)
      .attr("x", d => cellToPx(d.x, cellSize))
      .attr("y", d => cellToPx(d.y, cellSize))
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", d => d.dead ? "#555" : colorMap[d.player])
      .attr("stroke", d => d.isHead ? "#fff" : "#222")
      .attr("stroke-width", d => d.isHead ? 3 : 1)
      .attr("opacity", d => d.isTail ? 0.8 : 1);
    segsSel.exit().remove();

    // Highlight your snake with thick outline
    svg.selectAll(".snake-seg")
      .attr("filter", d =>
        (d.player === playerId && d.isHead) ?
        "drop-shadow(0 0 4px #fff)" : null
      );
  }, [gameState, cellSize, playerId]);

  // --- Keyboard => Send to backend ---
  useEffect(() => {
    if (!playerId) return;
    const keyToDir = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right"
    };
    function keyListener(e) {
      if (keyToDir[e.key]) {
        // If a "setDirection" function was set by parent, call it.
        // Otherwise, assume backend supplies a window.setDirection
        if (window.setDirection) {
          window.setDirection(keyToDir[e.key]);
        }
        // Or: emit to backend: connect.sendDirection(playerId, keyToDir[e.key]);
      }
    }
    window.addEventListener("keydown", keyListener);
    return () => window.removeEventListener("keydown", keyListener);
  }, [playerId]);

  // --- Scoreboard / status ---
  function renderInfo() {
    if (!gameState) return null;
    const snakeIds = Object.keys(gameState.snakes || {});
    return (
      <div style={{marginBottom:8}}>
        {snakeIds.map((id,idx) => {
          const sn = gameState.snakes[id];
          const isMe = (id === playerId);
          return (
            <span
              key={id}
              style={{
                marginRight:12,
                fontWeight: isMe ? 700 : 400,
                color: snakeColor(idx),
                background: isMe ? "#222" : "transparent",
                padding: "0 6px",
                borderRadius: 4
              }}
            >
              {isMe ? "You" : ("Player "+(idx+1))}
              {sn.alive ? "" : " (☠️dead)"}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      background: "#181818",
      border: "2px solid #222",
      borderRadius: 8,
      width: "fit-content",
      margin: "24px auto",
      padding: "16px",
      boxShadow: "0 2px 8px #000a"
    }}>
      <h3 style={{textAlign:'center', letterSpacing:2, color:"#fff", margin:'0 0 10px'}}>Multiplayer Snake</h3>
      {renderInfo()}
      <svg ref={svgRef} />
      <div style={{
        textAlign:'center', marginTop:10, color:"#ccc"
      }}>
        { playerId ? "Use arrow keys or WASD to control." : "Connecting..." }
      </div>
    </div>
  );
}