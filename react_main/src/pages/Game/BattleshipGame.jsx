import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Button, Stack, Typography } from "@mui/material";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
  SideMenu,
} from "./Game";
import { GameContext } from "../../Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/game.css";
import "css/gameBattleship.css";

const COL_LABELS = "ABCDEFGHIJ".split("");
const DEFAULT_SHIP_SPECS = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

export default function BattleshipGame() {
  const game = useContext(GameContext);
  const history = game.history;
  const updateStateViewing = game.updateStateViewing;

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    if (game.review) updateStateViewing({ type: "current" });
  }, []);

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={
          <>
            {history.currentState < 0 && <PlayerList />}
            <ActionList />
            <SettingsMenu />
          </>
        }
        centerPanelContent={<BattleshipBoardWrapper />}
        rightPanelContent={<TextMeetingLayout />}
      />
      <MobileLayout
        chatTab
        hideInfoTab
        outerLeftNavigationProps={{
          label: "Info",
          value: "players",
          icon: <i className="fas fa-info" />,
        }}
        outerLeftContent={
          <>
            <PlayerList />
            <ActionList />
          </>
        }
        innerRightContent={<BattleshipBoardWrapper />}
        innerRightNavigationProps={{
          label: "Board",
          value: "actions",
          icon: <i className="fas fa-th" />,
        }}
      />
    </GameTypeContext.Provider>
  );
}

function BattleshipBoardWrapper() {
  const game = useContext(GameContext);
  const history = game.history;
  const stateViewing = game.stateViewing;

  if (stateViewing === -1) return <TextMeetingLayout />;

  return (
    <SideMenu
      title="Fleet"
      scrollable
      content={
        <BattleshipStage
          review={game.review}
          isSpectator={game.isSpectator}
          isParticipant={game.isParticipant}
          selfId={game.self}
          socket={game.socket}
          stateViewing={stateViewing}
          currentState={history.currentState}
          stateExtraInfo={
            history.states[stateViewing]?.extraInfo ||
            history.states[history.currentState]?.extraInfo
          }
        />
      }
    />
  );
}

function BattleshipStage(props) {
  const [liveView, setLiveView] = useState(null);
  const isCurrentState = props.stateViewing === props.currentState;
  const isPhoneDevice = useIsPhoneDevice();

  useSocketListeners(
    (socket) => {
      socket.on("battleshipView", (view) => {
        setLiveView(view);
      });
    },
    props.socket
  );

  const view = useMemo(() => {
    if (isCurrentState && liveView) return liveView;
    const historyView = props.stateExtraInfo;
    if (historyView?.spectator) return historyView;
    if (historyView?.ownBoard) return historyView;
    if (historyView?.spectatorBoards) {
      return {
        spectator: true,
        players: historyView.spectatorBoards,
        phase: historyView.phase,
        currentTurnPlayerId: historyView.currentTurnPlayerId,
        gridSize: historyView.gridSize || 10,
      };
    }
    return liveView;
  }, [isCurrentState, liveView, props.stateExtraInfo]);

  if (!view) {
    return (
      <Typography variant="body2" sx={{ p: 2, textAlign: "center" }}>
        Awaiting fleet data…
      </Typography>
    );
  }

  if (view.spectator && view.players) {
    return <SpectatorBoards view={view} />;
  }

  const phase = view.phase || "Pregame";
  const canInteract =
    props.isParticipant && isCurrentState && !props.review;

  return (
    <div className="battleship-stage">
      <TurnBanner view={view} selfId={props.selfId} phase={phase} />

      {phase === "Place Ships" && canInteract && !view.myPlacementReady && (
        <PlacementPanel
          view={view}
          socket={props.socket}
          compact={isPhoneDevice}
        />
      )}

      {phase === "Place Ships" && view.myPlacementReady && (
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Fleet deployed. Waiting for opponent…
        </Typography>
      )}

      {(phase !== "Place Ships" || view.myPlacementReady) && (
        <BattleshipBoards
          view={view}
          phase={phase}
          canInteract={canInteract}
          socket={props.socket}
        />
      )}
    </div>
  );
}

function TurnBanner({ view, selfId, phase }) {
  let message = "";
  if (phase === "Place Ships") {
    message = view.myPlacementReady
      ? "Waiting for opponent to place ships"
      : "Place your fleet on the grid";
  } else if (phase === "Combat") {
    if (view.currentTurnPlayerId === selfId) {
      message = "Your turn — fire at the enemy grid";
    } else {
      message = "Opponent's turn";
    }
  } else if (phase === "Postgame" || view.gameOverReveal) {
    message = "Battle complete";
  } else {
    message = phase;
  }

  const isMyTurn =
    phase === "Combat" && view.currentTurnPlayerId === selfId;

  return (
    <div
      className={`battleship-turn-banner${isMyTurn ? " my-turn" : ""}`}
    >
      {message}
    </div>
  );
}

function BattleshipBoards({ view, phase, canInteract, socket }) {
  const fireEnabled =
    phase === "Combat" && canInteract && view.isMyTurn;

  return (
    <div className="battleship-boards">
      <BoardPanel
        title="Your Fleet"
        board={view.ownBoard}
        gridSize={view.gridSize}
      />
      <BoardPanel
        title="Enemy Waters"
        board={view.enemyBoard}
        gridSize={view.gridSize}
        onCellClick={
          fireEnabled
            ? (row, col) => {
                socket.send("battleshipFire", { row, col });
              }
            : null
        }
        clickable={fireEnabled}
      />
    </div>
  );
}

function SpectatorBoards({ view }) {
  return (
    <div className="battleship-spectator-boards">
      {view.players.map((playerView) => (
        <div
          key={playerView.playerId}
          className="battleship-spectator-player"
        >
          <h3>{playerView.playerName}</h3>
          <div className="battleship-spectator-pair">
            <BoardPanel
              title="Fleet"
              board={playerView.ownBoard}
              gridSize={view.gridSize}
            />
            <BoardPanel
              title="Targeting"
              board={playerView.enemyBoard}
              gridSize={view.gridSize}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlacementPanel({ view, socket, compact }) {
  const shipSpecs = view.shipSpecs || DEFAULT_SHIP_SPECS;
  const shipTypes = view.shipTypes || Object.keys(shipSpecs);
  const [orientation, setOrientation] = useState("H");
  const [selectedType, setSelectedType] = useState(shipTypes[0]);
  const [placedShips, setPlacedShips] = useState([]);
  const [previewCells, setPreviewCells] = useState([]);

  const remainingTypes = shipTypes.filter(
    (t) => !placedShips.some((s) => s.type === t)
  );

  useEffect(() => {
    if (remainingTypes.length > 0 && !remainingTypes.includes(selectedType)) {
      setSelectedType(remainingTypes[0]);
    }
  }, [placedShips, remainingTypes, selectedType]);

  const occupied = useMemo(() => {
    const set = new Set();
    for (const ship of placedShips) {
      for (const [r, c] of ship.cells) {
        set.add(`${r},${c}`);
      }
    }
    return set;
  }, [placedShips]);

  const buildCells = useCallback(
    (row, col) => {
      const len = shipSpecs[selectedType];
      if (!len) return [];
      const cells = [];
      for (let i = 0; i < len; i++) {
        const r = orientation === "H" ? row : row + i;
        const c = orientation === "H" ? col + i : col;
        if (r < 0 || r >= 10 || c < 0 || c >= 10) return null;
        if (occupied.has(`${r},${c}`)) return null;
        cells.push([r, c]);
      }
      return cells;
    },
    [selectedType, orientation, shipSpecs, occupied]
  );

  function onOwnCellHover(row, col) {
    const cells = buildCells(row, col);
    setPreviewCells(cells || []);
  }

  function onOwnCellClick(row, col) {
    const cells = buildCells(row, col);
    if (!cells) return;
    setPlacedShips([...placedShips, { type: selectedType, cells }]);
    setPreviewCells([]);
  }

  function submitFleet() {
    if (placedShips.length !== shipTypes.length) return;
    socket.send("battleshipPlace", { ships: placedShips });
  }

  const previewBoard = useMemo(() => {
    const grid = emptyBoard(10);
    for (const ship of placedShips) {
      for (const [r, c] of ship.cells) {
        grid[r][c] = { status: "ship", shipType: ship.type };
      }
    }
    for (const [r, c] of previewCells) {
      if (grid[r][c].status === "water") {
        grid[r][c] = { status: "ship", shipType: "preview" };
      }
    }
    return grid;
  }, [placedShips, previewCells]);

  return (
    <Stack spacing={1} className="battleship-placement-tools">
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button
          size="small"
          variant={orientation === "H" ? "contained" : "outlined"}
          onClick={() => setOrientation("H")}
        >
          Horizontal
        </Button>
        <Button
          size="small"
          variant={orientation === "V" ? "contained" : "outlined"}
          onClick={() => setOrientation("V")}
        >
          Vertical
        </Button>
      </Stack>
      <div className="battleship-ship-rack">
        {shipTypes.map((type) => {
          const placed = placedShips.some((s) => s.type === type);
          return (
            <button
              key={type}
              type="button"
              className={`battleship-ship-chip${
                selectedType === type && !placed ? " selected" : ""
              }${placed ? " placed" : ""}`}
              disabled={placed}
              onClick={() => setSelectedType(type)}
            >
              {type} ({shipSpecs[type]})
            </button>
          );
        })}
      </div>
      <BoardPanel
        title="Deploy Ships"
        board={previewBoard}
        gridSize={10}
        onCellClick={onOwnCellClick}
        onCellHover={onOwnCellHover}
        onMouseLeave={() => setPreviewCells([])}
        clickable
        highlightPreview={previewCells}
      />
      <Button
        variant="contained"
        disabled={placedShips.length !== shipTypes.length}
        onClick={submitFleet}
        fullWidth={compact}
      >
        Deploy Fleet
      </Button>
    </Stack>
  );
}

function BoardPanel({
  title,
  board,
  gridSize = 10,
  onCellClick,
  onCellHover,
  onMouseLeave,
  clickable,
  highlightPreview,
}) {
  if (!board) return null;

  return (
    <div className="battleship-board-panel">
      <div className="battleship-board-title">{title}</div>
      <div
        className="battleship-grid-wrapper"
        onMouseLeave={onMouseLeave}
      >
        <div />
        <div className="battleship-col-labels">
          {COL_LABELS.slice(0, gridSize).map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="battleship-row-labels">
          {Array.from({ length: gridSize }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="battleship-grid">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isPreview =
                highlightPreview &&
                highlightPreview.some(
                  ([r, c]) => r === rowIndex && c === colIndex
                );
              const shot =
                cell.status === "hit" ||
                cell.status === "sunk" ||
                cell.status === "miss";
              return (
                <BattleshipCell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  isPreview={isPreview}
                  clickable={clickable && !shot && cell.status !== "hit"}
                  onClick={
                    onCellClick
                      ? () => onCellClick(rowIndex, colIndex)
                      : undefined
                  }
                  onMouseEnter={
                    onCellHover
                      ? () => onCellHover(rowIndex, colIndex)
                      : undefined
                  }
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function BattleshipCell({ cell, clickable, onClick, onMouseEnter, isPreview }) {
  const status = isPreview ? "preview" : cell?.status || "water";
  const classNames = [
    "battleship-cell",
    `status-${status}`,
    clickable ? "clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    />
  );
}

function emptyBoard(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ status: "water" }))
  );
}
