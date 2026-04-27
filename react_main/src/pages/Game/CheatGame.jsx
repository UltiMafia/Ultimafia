import React, { useRef, useEffect, useContext, useState, useMemo } from "react";

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

const RANK_NAMES = {
  1: "Ace",
  11: "Jack",
  12: "Queen",
  13: "King",
};
const rankLabel = (n) =>
  RANK_NAMES[n] || (typeof n === "number" ? String(n) : "—");

function rankValue(card) {
  const rank = card.split("-")[0];
  if (rank === "Ace") return 1;
  if (rank === "Jack") return 11;
  if (rank === "Queen") return 12;
  if (rank === "King") return 13;
  return parseInt(rank, 10);
}

export default function CheatGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;

  const playBellRef = useRef(false);
  const [liveExtraInfo, setLiveExtraInfo] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const pushToast = (message) => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 1500);
  };

  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};

  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  // Mid-state mutations from the server (call lie outcomes) become stale
  // when a new state arrives — the canonical extraInfo is then in history.
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
    socket.on("cheatExtraInfo", (info) => setLiveExtraInfo(info));
    socket.on("cheatToast", ({ message }) => pushToast(message));
  }, game.socket);

  const playMeeting = Object.values(meetings).find(
    (m) => m && m.name === "Play Card" && m.amMember && !m.finished
  );
  const submitMeeting = Object.values(meetings).find(
    (m) => m && m.name === "Submit" && m.amMember && !m.finished
  );
  const callLieMeeting = Object.values(meetings).find(
    (m) => m && m.name === "Call Lie" && m.amMember && !m.finished
  );

  const handleCallLie = () => {
    if (!callLieMeeting || !game.socket) return;
    game.socket.send("vote", {
      meetingId: callLieMeeting.id,
      selection: "Call Lie",
    });
  };

  // Keep the latest closure available to the keydown listener so it doesn't
  // go stale between renders.
  const handleCallLieRef = useRef(handleCallLie);
  handleCallLieRef.current = handleCallLie;

  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code !== "Space") return;
      e.preventDefault();
      e.stopPropagation();
      if (tag === "BUTTON" && document.activeElement.blur) {
        document.activeElement.blur();
      }
      handleCallLieRef.current?.();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const board = (
    <CheatBoard
      history={history}
      stateViewing={stateViewing}
      self={self}
      socket={game.socket}
      liveExtraInfo={liveExtraInfo}
      toasts={toasts}
      playMeeting={playMeeting}
      submitMeeting={submitMeeting}
      callLieMeeting={callLieMeeting}
      onCallLie={handleCallLie}
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
    </GameTypeContext.Provider>
  );
}

function CheatBoard({
  history,
  stateViewing,
  self,
  socket,
  liveExtraInfo,
  toasts,
  playMeeting,
  submitMeeting,
  callLieMeeting,
  onCallLie,
}) {
  const stateExtraInfo =
    stateViewing >= 0 ? history.states[stateViewing].extraInfo : null;
  // Live snapshots reflect mid-state Call Lie mutations before the next state
  // arrives; fall back to the historical state otherwise.
  const extraInfo = liveExtraInfo || stateExtraInfo;

  const players = extraInfo?.randomizedPlayers || [];
  const meSimplified = players.find((p) => p.playerId === self);
  const others = players.filter((p) => p.playerId !== self);

  const myHandCards = meSimplified?.CardsInHand;
  const myHand = useMemo(() => {
    if (!myHandCards) return [];
    return [...myHandCards].sort((a, b) => rankValue(a) - rankValue(b));
  }, [myHandCards]);

  const serverSelected = useMemo(() => {
    if (!playMeeting) return [];
    const v = playMeeting.votes?.[self];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }, [playMeeting, self]);

  const serverSelectedKey = serverSelected.join("|");
  const playMeetingId = playMeeting?.id;

  const [selected, setSelected] = useState(() => new Set(serverSelected));

  useEffect(() => {
    setSelected(new Set(serverSelectedKey ? serverSelectedKey.split("|") : []));
  }, [serverSelectedKey, playMeetingId]);

  if (stateViewing < 0) {
    return (
      <SideMenu
        title="Cheat"
        scrollable
        content={<div className="ch-pregame">Waiting for players...</div>}
      />
    );
  }

  if (!extraInfo) return null;

  const isMyTurn = !!playMeeting;
  const turnPlayer = players.find((p) => p.userId === extraInfo.whoseTurnIsIt);
  const turnLabel = isMyTurn
    ? "Your turn"
    : turnPlayer
    ? `${turnPlayer.playerName}'s turn`
    : "Waiting...";

  const toggleCard = (card) => {
    if (!playMeeting || !socket) return;
    if (selected.has(card)) {
      socket.send("unvote", { meetingId: playMeeting.id, selection: card });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(card);
        return next;
      });
    } else {
      const max = playMeeting.multiMax ?? 4;
      if (selected.size >= max) return;
      socket.send("vote", { meetingId: playMeeting.id, selection: card });
      setSelected((prev) => {
        const next = new Set(prev);
        next.add(card);
        return next;
      });
    }
  };

  const handlePlay = () => {
    if (!submitMeeting || !socket) return;
    if (selected.size === 0) return;
    socket.send("vote", { meetingId: submitMeeting.id, selection: "Yes" });
  };

  const minPlay = playMeeting?.multiMin ?? 1;
  const canPlay = isMyTurn && !!submitMeeting && selected.size >= minPlay;
  const canCallLie = !!callLieMeeting;

  return (
    <SideMenu
      title={`Cheat — Round ${extraInfo.RoundNumber ?? 0}`}
      scrollable
      content={
        <div className="ch-board">
          <div className="ch-others">
            {others.length === 0 && (
              <div className="ch-empty-others">No other players</div>
            )}
            {others.map((p) => (
              <ChOpponent
                key={p.userId}
                player={p}
                isActiveTurn={extraInfo.whoseTurnIsIt === p.userId}
                isLastPlayer={extraInfo.lastPlay?.playerId === p.playerId}
                lastPlayInfo={
                  extraInfo.lastPlay?.playerId === p.playerId
                    ? extraInfo.lastPlay
                    : null
                }
              />
            ))}
          </div>

          <ChCurrentCard
            rank={extraInfo.RankNumber}
            stackCount={(extraInfo.TheStack || []).length}
            turnLabel={turnLabel}
            isMyTurn={isMyTurn}
            lastPlay={extraInfo.lastPlay}
            selfPlayerId={self}
          />

          <ChToasts toasts={toasts} />

          <ChOwnHand
            cards={myHand}
            selected={selected}
            onToggle={toggleCard}
            disabled={!isMyTurn}
            requiredRank={extraInfo.RankNumber}
          />

          <div className="ch-actions">
            <button
              className="ch-action-btn ch-action-play"
              onClick={handlePlay}
              style={canPlay ? undefined : { visibility: "hidden" }}
              tabIndex={canPlay ? 0 : -1}
              aria-hidden={!canPlay}
              title="Play selected cards"
            >
              Play
              {selected.size > 0 && (
                <span className="ch-play-count"> ({selected.size})</span>
              )}
            </button>
            <button
              className="ch-action-btn ch-action-calllie"
              onClick={onCallLie}
              style={canCallLie ? undefined : { visibility: "hidden" }}
              tabIndex={canCallLie ? 0 : -1}
              aria-hidden={!canCallLie}
              title="Call the last play a lie (Space)"
            >
              Call Lie <span className="ch-key-hint">(Space)</span>
            </button>
          </div>
        </div>
      }
    />
  );
}

function ChOpponent({ player, isActiveTurn, isLastPlayer, lastPlayInfo }) {
  const count = player.CardsInHand?.length ?? 0;
  return (
    <div
      className={`ch-opponent${isActiveTurn ? " ch-opponent-turn" : ""}${
        isLastPlayer ? " ch-opponent-lastplay" : ""
      }`}
    >
      <div className="ch-opponent-name">{player.playerName}</div>
      <div className="ch-card-fan">
        <div className="card card-unknown ch-fan-card ch-fan-card-3" />
        <div className="card card-unknown ch-fan-card ch-fan-card-2" />
        <div className="card card-unknown ch-fan-card ch-fan-card-1" />
        <span className="ch-card-count">{count}</span>
      </div>
      {isLastPlayer && lastPlayInfo && (
        <div className="ch-opponent-claim">
          claimed {lastPlayInfo.cardCount} × {rankLabel(lastPlayInfo.claimedRank)}
        </div>
      )}
    </div>
  );
}

function ChCurrentCard({
  rank,
  stackCount,
  turnLabel,
  isMyTurn,
  lastPlay,
  selfPlayerId,
}) {
  const isOwnLastPlay = lastPlay?.playerId === selfPlayerId;
  return (
    <div className="ch-current">
      <div className="ch-current-label">Current card</div>
      <div className="ch-current-rank">{rankLabel(rank)}</div>
      <div className={`ch-turn-line${isMyTurn ? " ch-turn-mine" : ""}`}>
        <span className="ch-turn-dot" />
        <span>{turnLabel}</span>
        <span className="ch-stack-info">
          Stack: <strong>{stackCount}</strong>
        </span>
      </div>
      {lastPlay && (
        <div
          className={`ch-lastplay${isOwnLastPlay ? " ch-lastplay-mine" : ""}`}
        >
          Last: <strong>{lastPlay.playerName}</strong> claimed{" "}
          {lastPlay.cardCount} × {rankLabel(lastPlay.claimedRank)}
        </div>
      )}
    </div>
  );
}

function ChOwnHand({ cards, selected, onToggle, disabled, requiredRank }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="ch-hand ch-hand-empty">
        <div className="ch-hand-label">Your hand</div>
        <div className="ch-hand-empty-note">No cards</div>
      </div>
    );
  }

  const n = cards.length;
  const center = (n - 1) / 2;
  // Tighten the fan as the hand grows so it doesn't blow past the panel edges.
  const spread = Math.min(7, n > 1 ? 50 / (n - 1) : 0);
  const fanStep = Math.min(34, n > 1 ? 240 / (n - 1) : 0);

  return (
    <div className="ch-hand">
      <div className="ch-hand-label">Your hand</div>
      <div
        className="ch-hand-fan"
        style={{ "--ch-fan-width": `${Math.max(220, fanStep * (n - 1) + 110)}px` }}
      >
        {cards.map((card, i) => {
          const offset = i - center;
          const rot = offset * spread;
          const dx = offset * fanStep;
          const isSelected = selected.has(card);
          const matchesRank = rankValue(card) === requiredRank;
          return (
            <button
              key={card}
              type="button"
              className={`ch-hand-card${isSelected ? " ch-hand-card-selected" : ""}${
                matchesRank ? " ch-hand-card-match" : ""
              }${disabled ? " ch-hand-card-disabled" : ""}`}
              style={{
                "--dx": `${dx}px`,
                "--rot": `${rot}deg`,
                zIndex: i + 1,
              }}
              onClick={() => !disabled && onToggle(card)}
              disabled={disabled}
              title={card.replace("-", " of ")}
            >
              <div className={`card c${card}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChToasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="ch-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="ch-toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
