import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

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
import DrawGuessedList from "./components/DrawGuessedList";

import "./components/DrawItGame.css";

export default function DrawItGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;

  const playBellRef = useRef(false);

  // Toast notifications for guesses + score reveals.
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const seenToastTimesRef = useRef(new Set());

  const pushToast = (message, time) => {
    if (time != null) {
      if (seenToastTimesRef.current.has(time)) return;
      seenToastTimesRef.current.add(time);
    }
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 2500);
  };

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState, updateStateViewing]);

  useEffect(() => {
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", () => {
      if (playBellRef.current) game.playAudio("ping");
      playBellRef.current = true;
    });
    socket.on("drawToast", ({ message, time }) => pushToast(message, time));
    socket.on("drawGuessers", (names) => {
      if (Array.isArray(names)) {
        setLiveGuessers((current) =>
          names.length > current.length ? names : current
        );
      }
    });
    socket.on("drawScoreEvents", (events) => {
      if (!Array.isArray(events)) return;
      const map = {};
      for (const e of events) {
        if (e && e.name) map[e.name] = e;
      }
      setScoreEventsByName(map);
    });
  }, game.socket);

  // Drawing tool state (drawer-only)
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(10);
  const [eraseMode, setEraseMode] = useState(false);

  // Postgame replay state
  const [replayTurnIndex, setReplayTurnIndex] = useState(0);
  const [replayPlayhead, setReplayPlayhead] = useState(Infinity);
  const replayIntervalRef = useRef(null);
  // Mobile pagination — show this many drawers per page in the replay grid.
  const REPLAY_DRAWERS_PER_PAGE = 3;
  const [replayDrawerPage, setReplayDrawerPage] = useState(0);

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
  // currentWord: present in extraInfo for everyone during Draw + Reveal. The
  // engine doesn't filter it per-recipient, so non-drawers technically have
  // the word in their socket payload during Draw — UI just hides it. Treat
  // any client-side use as if it were public.
  const currentWord = extraInfo.currentWord || null;
  // Live guessers list. extraInfo.guessers only refreshes on state
  // transitions; the server emits "drawGuessers" mid-Draw (and again at
  // Reveal start) so check marks appear as soon as each player solves the
  // word. We fully reset on Pick (new round); for other states we keep the
  // longer of the live list and extraInfo's snapshot, so a race between
  // the drawGuessers and state events can't drop the last guesser.
  const [liveGuessers, setLiveGuessers] = useState([]);
  useEffect(() => {
    if (stateName === "Pick") {
      setLiveGuessers([]);
      return;
    }
    setLiveGuessers((current) => {
      const fromExtra = Array.isArray(extraInfo.guessers)
        ? extraInfo.guessers
        : [];
      return fromExtra.length > current.length ? fromExtra : current;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateName]);
  const guessers = liveGuessers;

  // Per-player score-event popups shown beside the player list during Reveal.
  // Cleared at Pick (next round). Server emits "drawScoreEvents" at Reveal
  // start with [{name, delta, kind: "first"|"guesser"|"drawer"}, ...].
  const [scoreEventsByName, setScoreEventsByName] = useState({});
  useEffect(() => {
    if (stateName === "Pick") setScoreEventsByName({});
  }, [stateName]);
  const scores = extraInfo.scores || {};
  const initialStrokes = Array.isArray(extraInfo.strokes) ? extraInfo.strokes : [];
  // drawingHistory is only attached to the Postgame state's extraInfo. During
  // review (game.review === true) the user can scrub to any state, so fall
  // back to scanning all states' extraInfo for the array — the postgame
  // replay is then accessible from anywhere in the review timeline.
  const drawingHistory = useMemo(() => {
    if (Array.isArray(extraInfo.drawingHistory)) {
      return extraInfo.drawingHistory;
    }
    if (game.review && history && history.states) {
      for (const id in history.states) {
        const ei = history.states[id] && history.states[id].extraInfo;
        if (ei && Array.isArray(ei.drawingHistory)) {
          return ei.drawingHistory;
        }
      }
    }
    return null;
  }, [extraInfo.drawingHistory, game.review, history]);

  const isCurrentState = stateViewing === history.currentState;

  // Player list scoreboard chip + transient "+X" popup with an icon
  // representing how the points were earned (first guesser ★, drawer 🖌, or
  // any guesser ✓). The popup shows during Reveal and clears at Pick.
  const renderPlayerMarker = (player) => {
    const evt = scoreEventsByName[player.name];
    return (
      <>
        <span className="draw-score-chip">{scores[player.name] ?? 0}</span>
        {evt && (
          <span className={`draw-score-event draw-score-event-${evt.kind}`}>
            +{evt.delta}
            {evt.kind === "first" && (
              <i className="fas fa-star draw-score-event-icon" />
            )}
            {evt.kind === "drawer" && (
              <i className="fas fa-paint-brush draw-score-event-icon" />
            )}
            {evt.kind === "guesser" && (
              <i className="fas fa-check-circle draw-score-event-icon" />
            )}
          </span>
        )}
      </>
    );
  };
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
    // ~33 frames across the full drawing → finishes the replay in roughly
    // a third of the time the original animation took (3x speed).
    const stepSize = Math.max(1, Math.ceil(totalPoints / 33));
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

  // Group postgame turns into one column per drawer (in turn-order). Each
  // column lists the words that drawer drew; clicking a word loads its
  // replay below the grid.
  const drawerColumns = useMemo(() => {
    if (!Array.isArray(drawingHistory)) return [];
    const map = new Map();
    drawingHistory.forEach((turn, idx) => {
      const name = (turn && turn.drawer) || "—";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push({ ...turn, index: idx });
    });
    return Array.from(map, ([name, turns]) => ({ name, turns }));
  }, [drawingHistory]);

  const handleSelectReplayTurn = (idx) => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
    setReplayTurnIndex(idx);
    setReplayPlayhead(Infinity);
  };

  const renderReplay = (mobile) => {
    if (
      (!isPostgame && !game.review) ||
      !drawingHistory ||
      drawingHistory.length === 0
    ) {
      return null;
    }

    const pageCount = mobile
      ? Math.max(1, Math.ceil(drawerColumns.length / REPLAY_DRAWERS_PER_PAGE))
      : 1;
    const safePage = Math.min(replayDrawerPage, pageCount - 1);
    const visibleColumns = mobile
      ? drawerColumns.slice(
          safePage * REPLAY_DRAWERS_PER_PAGE,
          safePage * REPLAY_DRAWERS_PER_PAGE + REPLAY_DRAWERS_PER_PAGE
        )
      : drawerColumns;

    const turn = drawingHistory[replayTurnIndex];
    const turnStrokes =
      turn && Array.isArray(turn.strokes) ? turn.strokes : [];
    const totalPoints = turnStrokes.reduce(
      (acc, s) =>
        acc + (s && Array.isArray(s.points) ? s.points.length : 0),
      0
    );
    const effectivePlayhead =
      replayPlayhead === Infinity ? totalPoints : replayPlayhead;

    return (
      <div className="draw-it-postgame">
        <h3>Drawings replay</h3>
        <div
          className={
            "draw-it-replay-grid" +
            (mobile ? " draw-it-replay-grid-mobile" : "")
          }
          style={
            mobile
              ? undefined
              : {
                  gridTemplateColumns: `repeat(${Math.max(
                    1,
                    drawerColumns.length
                  )}, minmax(0, 1fr))`,
                }
          }
        >
          {visibleColumns.map((col) => (
            <div key={col.name} className="draw-it-replay-column">
              <div className="draw-it-replay-drawer">{col.name}</div>
              {col.turns.map((t) => (
                <button
                  key={t.index}
                  type="button"
                  className={
                    "draw-it-replay-word" +
                    (t.index === replayTurnIndex
                      ? " draw-it-replay-word-active"
                      : "")
                  }
                  onClick={() => handleSelectReplayTurn(t.index)}
                >
                  {t.word ? `"${t.word}"` : "—"}
                </button>
              ))}
            </div>
          ))}
        </div>
        {mobile && pageCount > 1 && (
          <div className="draw-it-replay-pagination">
            <button
              type="button"
              onClick={() =>
                setReplayDrawerPage((p) => Math.max(0, p - 1))
              }
              disabled={safePage === 0}
            >
              ‹
            </button>
            <span>
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setReplayDrawerPage((p) =>
                  Math.min(pageCount - 1, p + 1)
                )
              }
              disabled={safePage >= pageCount - 1}
            >
              ›
            </button>
          </div>
        )}
        {turn && (
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
        )}
      </div>
    );
  };

  // Center panel JSX is identical between desktop and mobile except for the
  // outer class and a mobile-only chat row during Draw. Render it once so
  // changes (e.g. the Reveal-state word overlay) can't drift between layouts.
  const renderCenter = (mobile = false) => (
    <div className={`draw-stage${mobile ? " draw-stage-mobile" : ""}`}>
      <WordDisplay
        isDrawer={isDrawer}
        stateName={stateName}
        currentWord={currentWord}
        wordLength={wordLength}
      />
      <ActionList
        bare
        meetingFilter={(m) => m.name !== "Vote Kick"}
        hideIfEmpty
        className="draw-action-list"
      />
      {isDrawer && (
        <DrawTools
          color={color}
          size={size}
          eraseMode={eraseMode}
          onColor={setColor}
          onSize={setSize}
          onErase={setEraseMode}
          onClear={() => emitClear(game.socket)}
          onUndo={() => emitUndo(game.socket)}
          hidden={!(stateName === "Draw" && isCurrentState)}
        />
      )}
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
          {currentWord &&
            ((isDrawer && stateName === "Draw") ||
              stateName === "Reveal") && (
              <div className="draw-canvas-word-overlay">{currentWord}</div>
            )}
          <DrawToasts toasts={toasts} />
        </div>
      )}
      {mobile && stateName === "Draw" && !isDrawer && (
        <div className="draw-mobile-chat">
          <TextMeetingLayout />
        </div>
      )}
      {renderReplay(mobile)}
    </div>
  );

  const rightContent = (
    <>
      <TextMeetingLayout />
      <DrawGuessedList
        guessers={guessers}
        me={selfPlayer}
        stateName={stateName}
        isDrawer={isDrawer}
      />
    </>
  );

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={leftContent}
        centerPanelContent={renderCenter()}
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
        innerRightContent={renderCenter(true)}
      />
    </GameTypeContext.Provider>
  );
}

function DrawToasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="draw-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="draw-toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
