import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  ActionList,
  PlayerList,
  SettingsMenu,
  TextMeetingLayout,
  MobileLayout,
  GameTypeContext,
  SideMenu,
} from "./Game";
import { GameContext } from "../../Contexts";
import { cardGameAudioConfig } from "../../audio/audioConfigs";

import "css/game.css";
import "css/gameCardGames.css";

const isKickMeeting = (m) => m && m.name === "Vote Kick";
const KickActionList = () => (
  <ActionList meetingFilter={isKickMeeting} hideIfEmpty scrollable={false} />
);
const isOtherMeeting = (m) =>
  m && m.name !== "Vote Kick" && m.name !== "Play Card" && m.name !== "Slap";

export default function RatscrewGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;

  const playBellRef = useRef(false);
  const [liveExtraInfo, setLiveExtraInfo] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [showRulesModal, setShowRulesModal] = useState(true);

  const pushToast = (message) => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 1000);
  };

  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  // Live mid-state updates (slap mutations) become stale when the state
  // changes — the next state's extraInfo is canonical.
  useEffect(() => {
    setLiveExtraInfo(null);
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(cardGameAudioConfig);
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", () => {
      if (playBellRef.current) game.playAudio("ping");
      playBellRef.current = true;
    });
    socket.on("cardShuffle", () => game.playAudio("cardShuffle"));
    socket.on("chips_large1", () => game.playAudio("chips_large1"));
    socket.on("chips_large2", () => game.playAudio("chips_large2"));
    socket.on("chips_small1", () => game.playAudio("chips_small1"));
    socket.on("chips_small2", () => game.playAudio("chips_small2"));
    socket.on("ratscrewExtraInfo", (info) => setLiveExtraInfo(info));
    socket.on("ratscrewToast", ({ message }) => pushToast(message));
  }, game.socket);

  // Pull the relevant action meetings up here so we can wire keyboard
  // shortcuts and the on-board buttons to the same handlers.
  const playMeeting = Object.values(meetings).find(
    (m) => m && m.name === "Play Card" && m.amMember && !m.finished
  );
  const slapMeeting = Object.values(meetings).find(
    (m) => m && m.name === "Slap" && m.amMember && !m.finished
  );

  const handlePlay = () => {
    if (!playMeeting || !game.socket) return;
    game.socket.send("vote", { meetingId: playMeeting.id, selection: "Yes" });
  };
  const handleSlap = () => {
    if (!slapMeeting || !game.socket) return;
    game.socket.send("vote", { meetingId: slapMeeting.id, selection: "Slap" });
  };

  // Keep the latest closures available to the keydown listener so the
  // handler doesn't go stale between renders.
  const handlePlayRef = useRef(handlePlay);
  const handleSlapRef = useRef(handleSlap);
  handlePlayRef.current = handlePlay;
  handleSlapRef.current = handleSlap;

  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code !== "Space" && e.code !== "KeyX") return;
      // Suppress the browser's default keyboard-activation of any focused
      // button so we don't fire the action twice (once via the focused
      // button, once via this listener).
      e.preventDefault();
      e.stopPropagation();
      if (tag === "BUTTON" && document.activeElement.blur) {
        document.activeElement.blur();
      }
      if (e.code === "Space") handleSlapRef.current?.();
      else handlePlayRef.current?.();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const gameOptions = game.options?.gameTypeOptions || {};

  const board = (
    <RatscrewBoard
      history={history}
      stateViewing={stateViewing}
      self={self}
      socket={game.socket}
      liveExtraInfo={liveExtraInfo}
      toasts={toasts}
      playMeeting={playMeeting}
      slapMeeting={slapMeeting}
      handlePlay={handlePlay}
      handleSlap={handleSlap}
    />
  );

  return (
    <GameTypeContext.Provider value={{ singleState: true }}>
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList />
            <KickActionList />
            <SettingsMenu />
          </>
        }
        centerPanelContent={board}
        rightPanelContent={<TextMeetingLayout />}
      />
      <MobileLayout
        outerLeftNavigationProps={{
          label: "Info",
          value: "players",
          icon: <i className="fas fa-info" />,
        }}
        outerLeftContent={
          <>
            <PlayerList />
            <KickActionList />
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-gamepad" />,
        }}
        innerRightContent={board}
        chatTab
        hideInfoTab
      />
      {showRulesModal && Object.keys(gameOptions).length > 0 && (
        <RatscrewRulesModal
          options={gameOptions}
          onClose={() => setShowRulesModal(false)}
        />
      )}
    </GameTypeContext.Provider>
  );
}

function MiniCard({ value }) {
  const cls = value ? `c${value}` : "card-unknown";
  return <div className={`card ${cls} rs-mini-card`} />;
}

function RuleRow({ label, cards }) {
  return (
    <div className="rs-rule-row">
      <div className="rs-rule-cards">
        {cards.map((v, i) => (
          <MiniCard key={i} value={v} />
        ))}
      </div>
      <div className="rs-rule-label">{label}</div>
    </div>
  );
}

function RatscrewRulesModal({ options, onClose }) {
  return (
    <div className="rs-modal-backdrop" onClick={onClose}>
      <div className="rs-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="rs-modal-title">Ratscrew — Active Rules</h2>
        <p className="rs-modal-subtitle">Slap when the pile shows:</p>
        <div className="rs-rules-grid">
          <RuleRow
            label={
              <>
                <b>Doubles</b> — same as the previous card
              </>
            }
            cards={["7-Hearts", "7-Spades"]}
          />
          <RuleRow
            label={
              <>
                <b>Sandwich</b> — same as the card two below
              </>
            }
            cards={["7-Hearts", "3-Clubs", "7-Spades"]}
          />
          <RuleRow
            label={
              <>
                Same as the <b>bottom</b> card of the pile
              </>
            }
            cards={["7-Hearts", null, null, "7-Spades"]}
          />
          {options.sumToTen && (
            <RuleRow
              label={
                <>
                  <b>Sum to 10</b> — top + previous = 10
                </>
              }
              cards={["4-Hearts", "6-Spades"]}
            />
          )}
          {options.marriageRule && (
            <RuleRow
              label={
                <>
                  <b>Marriage</b> — King and Queen adjacent
                </>
              }
              cards={["King-Hearts", "Queen-Spades"]}
            />
          )}
        </div>
        <p className="rs-modal-subtitle">Face cards:</p>
        <ul className="rs-modal-list">
          <li>
            Throwing a face card forces the next player to also throw a face
            card — fail and they lose the pile.
          </li>
          <li>Attempts allowed: J = 1, Q = 2, K = 3, A = 4</li>
        </ul>
        <p className="rs-modal-subtitle">Missed slaps:</p>
        <ul className="rs-modal-list">
          <li>Burn one card face-down into the pile.</li>
        </ul>
        <button className="rs-modal-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

function RatscrewBoard({
  history,
  stateViewing,
  self,
  socket,
  liveExtraInfo,
  toasts,
  playMeeting,
  slapMeeting,
  handlePlay,
  handleSlap,
}) {
  if (stateViewing < 0) {
    return (
      <SideMenu
        title="Ratscrew"
        scrollable
        content={<div className="rs-pregame">Waiting for players...</div>}
      />
    );
  }

  // Prefer the live mid-state snapshot when available so slap mutations
  // (burned cards, pile transfers) reflect immediately.
  const extraInfo =
    liveExtraInfo || history.states[stateViewing].extraInfo;
  if (!extraInfo) return null;

  const stack = extraInfo.TheStack || [];

  return (
    <SideMenu
      title="Ratscrew"
      scrollable
      content={
        <div className="rs-board">
          <div className="rs-players">
            {(extraInfo.randomizedPlayers || []).map((p) => (
              <RsPlayerHand
                key={p.userId}
                player={p}
                isActiveTurn={extraInfo.whoseTurnIsIt === p.userId}
                isSelf={p.playerId === self}
              />
            ))}
          </div>
          {extraInfo.faceChallenge && (
            <div className="rs-challenge">
              {extraInfo.faceChallenge.attemptsLeft} attempt
              {extraInfo.faceChallenge.attemptsLeft === 1 ? "" : "s"} left to
              meet {extraInfo.faceChallenge.challengerName}'s challenge
            </div>
          )}
          <RsPlayedStack cards={stack} />
          <RsToasts toasts={toasts} />
          <div className="rs-actions">
            <button
              className="rs-action-btn rs-action-play"
              onClick={handlePlay}
              style={playMeeting ? undefined : { visibility: "hidden" }}
              tabIndex={playMeeting ? 0 : -1}
              aria-hidden={!playMeeting}
              title="Play (X)"
            >
              Play <span className="rs-key-hint">(X)</span>
            </button>
            <button
              className={`rs-action-btn rs-action-slap${
                slapMeeting ? "" : " rs-action-disabled"
              }`}
              onClick={handleSlap}
              title="Slap (Space)"
            >
              Slap <span className="rs-key-hint">(Space)</span>
            </button>
          </div>
          <ActionList meetingFilter={isOtherMeeting} hideIfEmpty bare />
        </div>
      }
    />
  );
}

function RsPlayerHand({ player, isActiveTurn, isSelf }) {
  const count = player.CardsInHand?.length ?? 0;
  return (
    <div
      className={`rs-player${isActiveTurn ? " rs-player-turn" : ""}${
        isSelf ? " rs-player-self" : ""
      }`}
    >
      <div className="rs-player-name">{player.playerName}</div>
      <div className="rs-card-fan">
        <div className="card card-unknown rs-fan-card rs-fan-card-3" />
        <div className="card card-unknown rs-fan-card rs-fan-card-2" />
        <div className="card card-unknown rs-fan-card rs-fan-card-1" />
        <span className="rs-card-count">{count}</span>
      </div>
    </div>
  );
}

// Deterministic pseudo-random per card index — keeps the same card in the
// same place across re-renders so the pile doesn't jiggle.
function jitter(seed, range) {
  const x = Math.sin(seed * 9999.7) * 10000;
  return (x - Math.floor(x) - 0.5) * 2 * range;
}

function RsPlayedStack({ cards }) {
  return (
    <div className="rs-played">
      <div className="rs-played-stack">
        {cards.length === 0 && (
          <div className="card card-unknown rs-played-empty" />
        )}
        {cards.map((entry, i) => {
          // Backward-compat: legacy entries are bare strings.
          const value = typeof entry === "object" ? entry.value : entry;
          const faceDown = typeof entry === "object" && entry.faceDown;
          // Use a stable id when present so cards don't visually re-shuffle
          // when a new card is inserted into the middle.
          const id =
            typeof entry === "object" && entry.id != null
              ? entry.id
              : `legacy-${i}`;
          const seed = typeof id === "number" ? id : i + 1;
          const rot = jitter(seed + 1, 22);
          const dx = jitter(seed + 101, 10);
          const dy = jitter(seed + 211, 10);
          const cardClass = faceDown ? "card-unknown" : `c${value}`;
          return (
            <div
              key={id}
              className={`card ${cardClass} rs-played-card`}
              style={{
                transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(2)`,
                zIndex: i,
              }}
            />
          );
        })}
      </div>
      <div className="rs-stack-count">
        <strong>{cards.length}</strong> card{cards.length === 1 ? "" : "s"} in
        stack
      </div>
    </div>
  );
}

function RsToasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="rs-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="rs-toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
