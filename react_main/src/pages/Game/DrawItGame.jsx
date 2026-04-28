import React, { useContext, useEffect, useRef, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  SpeechFilter,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import DrawCanvas, { emitUndo, emitClear } from "./components/DrawCanvas";
import DrawTools from "./components/DrawTools";
import WordDisplay from "./components/WordDisplay";
import DrawSecretChat from "./components/DrawSecretChat";

import "./components/DrawItGame.css";

export default function DrawItGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;

  const playBellRef = useRef(false);

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", () => {
      if (playBellRef.current) game.playAudio("ping");
      playBellRef.current = true;
    });
    socket.on("winners", () => {});
  }, game.socket);

  // Drawing tool state (drawer-only)
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(8);
  const [eraseMode, setEraseMode] = useState(false);

  // Postgame replay state
  const [replayTurnIndex, setReplayTurnIndex] = useState(0);
  const [replayPlayhead, setReplayPlayhead] = useState(Infinity);
  const replayIntervalRef = useRef(null);

  const currentState = history.states[stateViewing];
  const extraInfo = (currentState && currentState.extraInfo) || {};
  const stateName = currentState ? currentState.name : "";
  const self = game.self;
  const selfPlayer = self && game.players ? game.players[self] : null;
  const selfName = selfPlayer ? selfPlayer.name : null;

  const drawer = extraInfo.drawer || null;
  const isDrawer = !!selfName && drawer === selfName;

  const round = extraInfo.round;
  const totalRounds = extraInfo.totalRounds;
  const wordLength = extraInfo.wordLength || null;
  const currentWord = extraInfo.currentWord || null; // server only sends to drawer
  const revealedWord = extraInfo.revealedWord || null;
  const guessers = Array.isArray(extraInfo.guessers) ? extraInfo.guessers : [];
  const scores = extraInfo.scores || {};
  const initialStrokes = Array.isArray(extraInfo.strokes) ? extraInfo.strokes : [];
  const drawingHistory = Array.isArray(extraInfo.drawingHistory)
    ? extraInfo.drawingHistory
    : null;

  const isCurrentState = stateViewing === history.currentState;

  // Player list scoreboard chip
  const renderPlayerMarker = (player) => (
    <span className="draw-score-chip">{scores[player.name] ?? 0}</span>
  );
  const renderPlayerRowEnd = (player) => {
    if (player.name === drawer) {
      return (
        <i
          className="fas fa-paint-brush draw-row-drawer"
          title="Drawer this turn"
        />
      );
    }
    if (guessers.includes(player.name)) {
      return (
        <i
          className="fas fa-check-circle draw-row-guessed"
          title="Guessed!"
        />
      );
    }
    return null;
  };

  // Canvas mode: drawer paints; everyone else views (replay during Reveal/scrub)
  const canvasMode = isDrawer && stateName === "Draw" ? "drawer" : "viewer";

  const leftContent = (
    <>
      <PlayerList
        renderMarker={renderPlayerMarker}
        renderRowEnd={renderPlayerRowEnd}
      />
      <ActionList
        meetingFilter={(m) => m.name === "Vote Kick"}
        hideIfEmpty
        scrollable={false}
      />
      <div className="draw-round-info">
        <div className="draw-round-line">
          Round {round || "-"} / {totalRounds || "-"}
        </div>
        {drawer && (
          <div className="draw-turn-line">
            Turn: <strong>{drawer}</strong>
          </div>
        )}
      </div>
      <SpeechFilter />
      <SettingsMenu />
    </>
  );

  const isPostgame = stateName === "Postgame";

  const startReplayAnimation = (totalPoints) => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
    if (!totalPoints || totalPoints <= 0) {
      setReplayPlayhead(0);
      return;
    }
    setReplayPlayhead(0);
    let ph = 0;
    const stepSize = Math.max(1, Math.ceil(totalPoints / 100));
    replayIntervalRef.current = setInterval(() => {
      ph += stepSize;
      if (ph >= totalPoints) {
        setReplayPlayhead(totalPoints);
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      } else {
        setReplayPlayhead(ph);
      }
    }, 50);
  };

  // Cleanup replay animation on unmount
  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
    };
  }, []);

  const postgameReplay =
    isPostgame && drawingHistory && drawingHistory.length > 0 ? (
      <div className="draw-it-postgame">
        <h3>Drawings replay</h3>
        <div className="draw-it-turn-list">
          {drawingHistory.map((turn, i) => (
            <button
              key={i}
              type="button"
              className={
                "draw-it-turn-btn" +
                (i === replayTurnIndex ? " active" : "")
              }
              onClick={() => {
                if (replayIntervalRef.current) {
                  clearInterval(replayIntervalRef.current);
                  replayIntervalRef.current = null;
                }
                setReplayTurnIndex(i);
                setReplayPlayhead(Infinity);
              }}
            >
              Turn {i + 1}: {turn.drawer || "—"} drew "{turn.word}"
            </button>
          ))}
        </div>

        {(() => {
          const turn = drawingHistory[replayTurnIndex];
          if (!turn) return null;
          const turnStrokes = Array.isArray(turn.strokes) ? turn.strokes : [];
          const totalPoints = turnStrokes.reduce(
            (acc, s) =>
              acc + (s && Array.isArray(s.points) ? s.points.length : 0),
            0
          );
          const effectivePlayhead =
            replayPlayhead === Infinity ? totalPoints : replayPlayhead;
          return (
            <div className="draw-it-replay">
              <DrawCanvas
                mode="replay"
                strokes={turnStrokes}
                playhead={effectivePlayhead}
              />
              <div className="draw-it-replay-controls">
                <button
                  type="button"
                  onClick={() => startReplayAnimation(totalPoints)}
                >
                  ▶ Replay
                </button>
                <input
                  type="range"
                  min={0}
                  max={totalPoints}
                  value={effectivePlayhead}
                  onChange={(e) => {
                    if (replayIntervalRef.current) {
                      clearInterval(replayIntervalRef.current);
                      replayIntervalRef.current = null;
                    }
                    setReplayPlayhead(Number(e.target.value));
                  }}
                />
              </div>
            </div>
          );
        })()}
      </div>
    ) : null;

  const centerContent = (
    <div className="draw-stage">
      <WordDisplay
        isDrawer={isDrawer}
        stateName={stateName}
        currentWord={currentWord}
        wordLength={wordLength}
        revealedWord={revealedWord}
      />
      <ActionList
        bare
        meetingFilter={(m) => m.name !== "Vote Kick" && m.name !== "SecretChat"}
        hideIfEmpty
        className="draw-action-list"
      />
      <DrawTools
        color={color}
        size={size}
        eraseMode={eraseMode}
        onColor={setColor}
        onSize={setSize}
        onErase={setEraseMode}
        onClear={() => emitClear(game.socket)}
        onUndo={() => emitUndo(game.socket)}
        hidden={!(isDrawer && stateName === "Draw" && isCurrentState)}
      />
      {!isPostgame && (
        <div className="draw-canvas-wrap">
          {isCurrentState && (
            <DrawCanvas
              mode={canvasMode}
              socket={game.socket}
              initialStrokes={initialStrokes}
              color={color}
              size={size}
              eraseMode={eraseMode}
            />
          )}
        </div>
      )}
      {postgameReplay}
    </div>
  );

  const rightContent = (
    <>
      <TextMeetingLayout />
      <DrawSecretChat
        guessers={guessers}
        me={selfPlayer}
        stateName={stateName}
      />
    </>
  );

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={leftContent}
        centerPanelContent={centerContent}
        rightPanelContent={rightContent}
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
            <PlayerList
              renderMarker={renderPlayerMarker}
              renderRowEnd={renderPlayerRowEnd}
            />
            <div className="draw-round-info">
              <div className="draw-round-line">
                Round {round || "-"} / {totalRounds || "-"}
              </div>
              {drawer && (
                <div className="draw-turn-line">
                  Turn: <strong>{drawer}</strong>
                </div>
              )}
            </div>
            <ActionList
              meetingFilter={(m) => m.name === "Vote Kick"}
              hideIfEmpty
              scrollable={false}
            />
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-paint-brush" />,
        }}
        innerRightContent={
          <div className="draw-stage draw-stage-mobile">
            <WordDisplay
              isDrawer={isDrawer}
              stateName={stateName}
              currentWord={currentWord}
              wordLength={wordLength}
              revealedWord={revealedWord}
            />
            <ActionList
              bare
              meetingFilter={(m) => m.name !== "Vote Kick" && m.name !== "SecretChat"}
              hideIfEmpty
              className="draw-action-list"
            />
            <DrawTools
              color={color}
              size={size}
              eraseMode={eraseMode}
              onColor={setColor}
              onSize={setSize}
              onErase={setEraseMode}
              onClear={() => emitClear(game.socket)}
              onUndo={() => emitUndo(game.socket)}
              hidden={!(isDrawer && stateName === "Draw" && isCurrentState)}
            />
            {!isPostgame && (
              <div className="draw-canvas-wrap">
                {isCurrentState && (
                  <DrawCanvas
                    mode={canvasMode}
                    socket={game.socket}
                    initialStrokes={initialStrokes}
                    color={color}
                    size={size}
                    eraseMode={eraseMode}
                  />
                )}
              </div>
            )}
            {postgameReplay}
          </div>
        }
      />
    </GameTypeContext.Provider>
  );
}
