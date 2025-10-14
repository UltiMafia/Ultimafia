import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useSocketListeners } from "./Game";

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
export default function SnakeGameDisplay({ player, players, gameSocket }) {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(player || -1);
  const svgRef = useRef();
  const [cellSize, setCellSize] = useState(24); // pixels per grid square

  useSocketListeners((socket) => {
    socket.on("gameState", (state) => {
      setGameState(state);
    });
  }, gameSocket);

  useEffect(() => {
    if (!gameSocket) {
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
    }
    // else: real connect to backend not implemented in this file
  }, [gameSocket]);

  useEffect(() => {
    if (!gameState) return;

    const gridSize = gameState.gridSize || 20;
    const svg = d3
      .select(svgRef.current)
      .attr("width", gridSize * cellSize)
      .attr("height", gridSize * cellSize)
      .attr("viewBox", `0 0 ${gridSize * cellSize} ${gridSize * cellSize}`);

    let vertLines = svg.selectAll(".gridline-vert").data(d3.range(1, gridSize));
    vertLines
      .enter()
      .append("line")
      .attr("class", "gridline gridline-vert")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .merge(vertLines)
      .attr("x1", (d) => cellToPx(d, cellSize))
      .attr("x2", (d) => cellToPx(d, cellSize))
      .attr("y1", 0)
      .attr("y2", cellToPx(gridSize, cellSize));
    vertLines.exit().remove();

    let horizLines = svg
      .selectAll(".gridline-horiz")
      .data(d3.range(1, gridSize));
    horizLines
      .enter()
      .append("line")
      .attr("class", "gridline gridline-horiz")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .merge(horizLines)
      .attr("y1", (d) => cellToPx(d, cellSize))
      .attr("y2", (d) => cellToPx(d, cellSize))
      .attr("x1", 0)
      .attr("x2", cellToPx(gridSize, cellSize));
    horizLines.exit().remove();

    // --- Draw Food ---
    // --- Draw Food --- (modified to handle multiple foods)
    let foodSel = svg.selectAll(".food").data(gameState.foods || []);
    foodSel
      .enter()
      .append("rect")
      .attr("class", "food")
      .attr("rx", cellSize / 5)
      .attr("ry", cellSize / 5)
      .merge(foodSel)
      .attr("x", (d) => cellToPx(d.x, cellSize))
      .attr("y", (d) => cellToPx(d.y, cellSize))
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
      const segs = snake.segments
        .filter((se) => se.active == true)
        .map((s, i) => ({
          ...s,
          player: id,
          index: i,
          isHead: i === 0,
          isTail: i === snake.segments.length - 1,
          dead: !snake.alive,
        }));
      allSegs.push(...segs);
    });

    // One color per player
    const colorMap = {};
    snakePlayerIds.forEach((id, idx) => (colorMap[id] = snakeColor(idx)));

    let segsSel = svg
      .selectAll(".snake-seg")
      .data(allSegs, (d) => d.player + "-" + d.index);
    segsSel
      .enter()
      .append("rect")
      .attr("class", "snake-seg")
      .merge(segsSel)
      .attr("x", (d) => cellToPx(d.x, cellSize))
      .attr("y", (d) => cellToPx(d.y, cellSize))
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

    // --- Draw player names at snake heads ---
    let headNames = [];
    snakePlayerIds.forEach((id, idx) => {
      const snake = gameState.snakes[id];
      if (snake.segments.length > 0) {
        headNames.push({
          x: snake.segments[0].x,
          y: snake.segments[0].y,
          id,
          name:
            players && players[id] && players[id].name
              ? players[id].name
              : `Player ${idx + 1}`,
        });
      }
    });

    let nameSel = svg.selectAll(".snake-name").data(headNames, (d) => d.id);
    nameSel
      .enter()
      .append("text")
      .attr("class", "snake-name")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("pointer-events", "none")
      .style("font-size", Math.max(cellSize * 0.5, 10))
      .style("fill", "#fff")
      .style("font-weight", 600)
      .merge(nameSel)
      .attr("x", (d) => cellToPx(d.x + 0.5, cellSize))
      .attr("y", (d) => cellToPx(d.y + 0.5, cellSize))
      .text((d) => d.name);
    nameSel.exit().remove();
  }, [gameState, cellSize, playerId, players]);

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
      }}
    >
      <svg ref={svgRef} />
      <div
        style={{
          textAlign: "center",
          marginTop: 10,
          color: "#ccc",
        }}
      ></div>
    </div>
  );
}
