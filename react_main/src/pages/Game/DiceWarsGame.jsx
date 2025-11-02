import React, { useRef, useEffect, useContext, useState } from "react";
import * as d3 from "d3";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  GameTypeContext,
  SideMenu,
} from "./Game";
import { GameContext } from "../../Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/gameBattlesnakes.css"; // Reuse Battlesnakes CSS as placeholder

export default function DiceWarsGame(props) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;

  const gameType = "Dice Wars";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};

  const audioFileNames = ["music/14_Minigame"];
  const audioLoops = [true];
  const audioOverrides = [true];
  const audioVolumes = [1];

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(
      audioFileNames,
      audioLoops,
      audioOverrides,
      audioVolumes
    );

    // Make game review start at pregame
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("start", () => {
      game.playAudio("music/14_Minigame");
    });
  }, game.socket);

  if (isPhoneDevice) {
    // Unsupported
    game.leaveGame();
    alert("Dice Wars is not presently supported on mobile devices.");
    return <></>;
  }

  return (
    <GameTypeContext.Provider
      value={{
        singleState: true,
      }}
    >
      <TopBar hideStateSwitcher />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList />
            <ActionList />
          </>
        }
        centerPanelContent={
          <>
            {players && game.socket && (
              <DiceWarsBoardWrapper
                player={self}
                players={players}
                gameSocket={game.socket}
                history={history}
                stateViewing={stateViewing}
              />
            )}
          </>
        }
        rightPanelContent={
          <>
            <TextMeetingLayout combineMessagesFromAllMeetings />
          </>
        }
      />
    </GameTypeContext.Provider>
  );
}

function DiceWarsBoardWrapper({ player, players, gameSocket, history, stateViewing }) {
  const [gameState, setGameState] = useState(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState(null);
  const [playerId, setPlayerId] = useState(player || null);
  const [attackResult, setAttackResult] = useState(null);
  const svgRef = useRef();
  const hexSize = 30; // radius of each hex

  useSocketListeners((socket) => {
    socket.on("gameState", (state) => {
      console.log("Frontend received gameState update:", {
        turnNumber: state.turnNumber,
        currentTurnPlayerId: state.currentTurnPlayerId,
        roundNumber: state.roundNumber
      });
      setGameState(state);
    });

    socket.on("attackResult", (result) => {
      console.log("Frontend received attackResult:", result);
      setAttackResult(result);
      // Clear attack result after 3 seconds
      setTimeout(() => setAttackResult(null), 3000);
    });
  }, gameSocket);

  useEffect(() => {
    if (player) {
      setPlayerId(player);
    }
  }, [player]);

  // Update game state from history when viewing past states
  useEffect(() => {
    if (history && stateViewing >= 0 && history.states[stateViewing]) {
      const extraInfo = history.states[stateViewing].extraInfo;
      if (extraInfo && extraInfo.territories) {
        console.log("Loading game state from history - state:", stateViewing);
        setGameState(extraInfo);
      }
    }
  }, [history, stateViewing]);

  // Convert offset hex coordinates to pixel position (flat-top orientation)
  const hexToPixel = (col, row) => {
    const x = hexSize * (3 / 2) * col;
    const y = hexSize * Math.sqrt(3) * (row + 0.5 * (col % 2));
    return { x, y };
  };

  // Generate hex path for SVG (flat-top orientation to match coordinates)
  const getHexPath = (centerX, centerY) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i; // Start at 0 for flat-top hexes
      const x = centerX + hexSize * Math.cos(angle);
      const y = centerY + hexSize * Math.sin(angle);
      points.push([x, y]);
    }
    return (
      points
        .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
        .join(" ") + "Z"
    );
  };

  // Get hex corner points (flat-top orientation)
  const getHexCorners = (centerX, centerY) => {
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      corners.push({
        x: centerX + hexSize * Math.cos(angle),
        y: centerY + hexSize * Math.sin(angle),
      });
    }
    return corners;
  };

  // Build a unified polygon path for a multi-hex territory
  const buildTerritoryPath = (territoryId, hexGrid, offsetX, offsetY) => {
    // Only include hexes that belong to this territory AND are not ocean
    const territoryHexes = hexGrid.filter(
      (h) => h.territoryId === territoryId && !h.isOcean
    );
    if (territoryHexes.length === 0) return null;

    // For single-hex territories, just return the hex path
    if (territoryHexes.length === 1) {
      const hex = territoryHexes[0];
      const pos = hexToPixel(hex.col, hex.row);
      return getHexPath(pos.x + offsetX, pos.y + offsetY);
    }

    // For multi-hex territories, build the outer perimeter
    // Find all edges that are on the boundary (not shared with same territory)
    const edges = new Map(); // key: "x1,y1,x2,y2" -> count

    territoryHexes.forEach((hex) => {
      const pos = hexToPixel(hex.col, hex.row);
      const corners = getHexCorners(pos.x + offsetX, pos.y + offsetY);

      // Each hex has 6 edges
      for (let i = 0; i < 6; i++) {
        const p1 = corners[i];
        const p2 = corners[(i + 1) % 6];
        
        // Create edge key (normalized so direction doesn't matter)
        const edgeKey =
          p1.x < p2.x || (p1.x === p2.x && p1.y < p2.y)
            ? `${p1.x.toFixed(2)},${p1.y.toFixed(2)},${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
            : `${p2.x.toFixed(2)},${p2.y.toFixed(2)},${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;

        edges.set(edgeKey, (edges.get(edgeKey) || 0) + 1);
      }
    });

    // Perimeter edges appear exactly once (not shared with another hex in territory)
    const perimeterEdges = [];
    edges.forEach((count, key) => {
      if (count === 1) {
        const [x1, y1, x2, y2] = key.split(",").map(Number);
        perimeterEdges.push({ x1, y1, x2, y2 });
      }
    });

    if (perimeterEdges.length === 0) return null;

    // Build a continuous path from the perimeter edges
    const path = [];
    const usedEdges = new Set();
    
    // Start with the first edge
    let currentEdge = perimeterEdges[0];
    path.push({ x: currentEdge.x1, y: currentEdge.y1 });
    path.push({ x: currentEdge.x2, y: currentEdge.y2 });
    usedEdges.add(0);

    let currentPoint = { x: currentEdge.x2, y: currentEdge.y2 };

    // Find connecting edges
    while (usedEdges.size < perimeterEdges.length) {
      let foundNext = false;

      for (let i = 0; i < perimeterEdges.length; i++) {
        if (usedEdges.has(i)) continue;

        const edge = perimeterEdges[i];
        const dist1 = Math.abs(edge.x1 - currentPoint.x) + Math.abs(edge.y1 - currentPoint.y);
        const dist2 = Math.abs(edge.x2 - currentPoint.x) + Math.abs(edge.y2 - currentPoint.y);

        if (dist1 < 0.1) {
          // Connect via x1->x2
          currentPoint = { x: edge.x2, y: edge.y2 };
          path.push(currentPoint);
          usedEdges.add(i);
          foundNext = true;
          break;
        } else if (dist2 < 0.1) {
          // Connect via x2->x1
          currentPoint = { x: edge.x1, y: edge.y1 };
          path.push(currentPoint);
          usedEdges.add(i);
          foundNext = true;
          break;
        }
      }

      if (!foundNext) break;
    }

    // Build SVG path
    if (path.length < 3) return null;

    return (
      path
        .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
        .join(" ") + "Z"
    );
  };

  // Handle hex click (can be territory or ocean)
  const handleHexClick = (hex) => {
    // Ocean tiles can't be clicked
    if (hex.isOcean || hex.territoryId === null) {
      return;
    }

    const territory = gameState.territories.find((t) => t.id === hex.territoryId);
    if (!territory) return;

    console.log("Territory clicked:", territory.id);
    if (!gameState || gameState.currentTurnPlayerId !== playerId) {
      console.log("Not your turn or no game state");
      return;
    }

    // If no territory selected, select this one (if owned by current player)
    if (!selectedTerritoryId) {
      if (territory.playerId === playerId && territory.dice >= 2) {
        console.log("Selecting territory:", territory.id);
        setSelectedTerritoryId(territory.id);
      }
      return;
    }

    // If clicking the same territory, deselect
    if (selectedTerritoryId === territory.id) {
      console.log("Deselecting territory");
      setSelectedTerritoryId(null);
      return;
    }

    // If a different territory is selected, try to attack
    const fromTerritory = gameState.territories.find(
      (t) => t.id === selectedTerritoryId
    );
    if (
      fromTerritory &&
      fromTerritory.neighbors.includes(territory.id) &&
      territory.playerId !== playerId
    ) {
      console.log("Sending attack from", selectedTerritoryId, "to", territory.id);
      gameSocket.send("attack", {
        fromId: selectedTerritoryId,
        toId: territory.id,
      });
      setSelectedTerritoryId(null);
    } else if (territory.playerId === playerId && territory.dice >= 2) {
      // Select a different owned territory
      console.log("Switching selection to:", territory.id);
      setSelectedTerritoryId(territory.id);
    } else {
      console.log("Invalid action, deselecting");
      setSelectedTerritoryId(null);
    }
  };

  useEffect(() => {
    if (!gameState || !gameState.hexGrid || !gameState.territories) return;

    const hexGrid = gameState.hexGrid;
    const territories = gameState.territories;
    const playerColors = gameState.playerColors || {};

    // Create a map for quick territory lookup
    const territoryMap = {};
    territories.forEach((t) => {
      territoryMap[t.id] = t;
    });

    // Calculate bounds for centering
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    hexGrid.forEach((hex) => {
      const pos = hexToPixel(hex.col, hex.row);
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });

    const padding = hexSize * 2;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Clear previous content
    svg.selectAll("*").remove();

    // Create groups for rendering
    const oceanGroup = svg.append("g");
    const territoryGroup = svg.append("g");
    const textGroup = svg.append("g");

    // First, draw ocean hexes
    hexGrid.forEach((hex) => {
      const isOcean = hex.isOcean || hex.territoryId === null;
      if (isOcean) {
        const pos = hexToPixel(hex.col, hex.row);
        const centerX = pos.x + offsetX;
        const centerY = pos.y + offsetY;
        const hexPath = getHexPath(centerX, centerY);

        oceanGroup
          .append("path")
          .attr("d", hexPath)
          .attr("fill", "#1a1a2e")
          .attr("stroke", "#0f0f1e")
          .attr("stroke-width", 1)
          .attr("opacity", 0.3);
      }
    });

    // Draw territories as unified shapes
    const drawnTerritories = new Set();
    territories.forEach((territory) => {
      if (drawnTerritories.has(territory.id)) return;
      drawnTerritories.add(territory.id);

      const territoryPath = buildTerritoryPath(
        territory.id,
        hexGrid,
        offsetX,
        offsetY
      );
      if (!territoryPath) return;

      const isSelected = selectedTerritoryId === territory.id;
      const isOwned = territory.playerId === playerId;
      const isCurrentPlayer = gameState.currentTurnPlayerId === playerId;
      const canSelect = isOwned && territory.dice >= 2 && isCurrentPlayer;
      const isNeighborOfSelected =
        selectedTerritoryId &&
        territoryMap[selectedTerritoryId]?.neighbors.includes(territory.id);
      const isValidAttackTarget =
        isNeighborOfSelected && !isOwned && isCurrentPlayer;

      // Determine territory color
      let fillColor = "#333";
      if (territory.playerId) {
        fillColor = playerColors[territory.playerId] || "#888";
      }

      // Determine stroke
      let strokeColor;
      let strokeWidth;

      if (isSelected) {
        strokeColor = "#FFD700";
        strokeWidth = 5;
      } else if (isValidAttackTarget) {
        strokeColor = "#FFA500";
        strokeWidth = 4;
      } else {
        strokeColor = "#222";
        strokeWidth = 2;
      }

      // Determine if this territory is clickable
      const isClickable = isCurrentPlayer && (canSelect || isValidAttackTarget);

      // Draw unified territory shape
      const territoryElement = territoryGroup
        .append("path")
        .attr("d", territoryPath)
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", territory.playerId ? 0.8 : 0.3)
        .style("cursor", isClickable ? "pointer" : "default")
        .on("click", function (event) {
          event.stopPropagation();
          // Find any hex in this territory for the click handler
          const territoryHex = hexGrid.find((h) => h.territoryId === territory.id);
          if (territoryHex) {
            handleHexClick(territoryHex);
          }
        });

      // Add hover effect for clickable territories
      if (isClickable) {
        territoryElement
          .on("mouseenter", function () {
            d3.select(this)
              .attr("opacity", 1)
              .attr("stroke-width", isSelected ? 6 : 5);
          })
          .on("mouseleave", function () {
            d3.select(this)
              .attr("opacity", territory.playerId ? 0.8 : 0.3)
              .attr(
                "stroke-width",
                isSelected ? 5 : isValidAttackTarget ? 4 : 2
              );
          });
      }

      // Draw dice count and ID on the center hex
      const pos = hexToPixel(territory.col, territory.row);
      const centerX = pos.x + offsetX;
      const centerY = pos.y + offsetY;

      // Draw dice count
      textGroup
        .append("text")
        .attr("x", centerX)
        .attr("y", centerY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("fill", "#FFF")
        .style("pointer-events", "none")
        .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.8)")
        .text(territory.dice || "");

      // Draw territory ID (small)
      textGroup
        .append("text")
        .attr("x", centerX)
        .attr("y", centerY + hexSize * 0.6)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("font-size", "10px")
        .style("fill", "#AAA")
        .style("pointer-events", "none")
        .text(`#${territory.id}`);
    });
  }, [gameState, selectedTerritoryId, playerId, hexSize]);

  // Get player name by ID
  const getPlayerName = (playerId) => {
    return players && players[playerId] ? players[playerId].name : "Unknown";
  };

  // Get current turn player name
  const getCurrentTurnPlayerName = () => {
    if (!gameState) return "";
    return getPlayerName(gameState.currentTurnPlayerId);
  };

  // Don't render until game has started
  if (!gameState || !gameState.territories || gameState.turnNumber === 0) {
    return (
      <SideMenu
        title="Pregame"
        scrollable
        content={
          <div
            style={{
              background: "#181818",
              border: "2px solid #222",
              borderRadius: 8,
              width: "fit-content",
              margin: "24px auto",
              padding: "24px",
              boxShadow: "0 2px 8px #000a",
              color: "#FFF",
              textAlign: "center",
              fontSize: "18px",
            }}
          >
          </div>
        }
      />
    );
  }

  return (
    <SideMenu
      title={`${getCurrentTurnPlayerName()}'s Turn`}
      scrollable
      content={
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
          {/* Game board */}
          <svg ref={svgRef} style={{ display: "block", margin: "0 auto" }} />

          {/* Attack result display */}
          {attackResult && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                backgroundColor: attackResult.won ? "#4CAF50" : "#f44336",
                color: "white",
                borderRadius: "4px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              <div>
                {attackResult.won ? "Attack Successful! ✓" : "Attack Failed! ✗"}
              </div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                Attacker rolled: {attackResult.attackRoll?.join(", ")} ={" "}
                {attackResult.attackTotal}
              </div>
              <div style={{ fontSize: "14px" }}>
                Defender rolled: {attackResult.defenseRoll?.join(", ")} ={" "}
                {attackResult.defenseTotal}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
