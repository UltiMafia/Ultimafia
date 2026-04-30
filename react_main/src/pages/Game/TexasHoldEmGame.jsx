import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  PlayerList,
  Notes,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
  ActionList,
} from "./Game";
import { GameContext } from "../../Contexts";
import { cardGameAudioConfig } from "../../audio/audioConfigs";
import PokerTable from "./PokerTable";
import PokerActions from "./PokerActions";
import PokerHandHistory from "./PokerHandHistory";

import "css/game.css";
import "css/gameCardGames.css";
import "css/gamePoker.css";

export default function TexasHoldEmGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateStateViewing = game.updateStateViewing;

  const playBellRef = useRef(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  // Same socket fires for every panel mounted in the page; dedupe by `time`.
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
    }, 1800);
  };

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(cardGameAudioConfig);

    // Make game review start at pregame
    if (game.review) updateStateViewing({ type: "first" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;
    });

    socket.on("winners", (winners) => {});
    socket.on("cardShuffle", () => {
      game.playAudio("cardShuffle");
    });
    socket.on("chips_large1", () => {
      game.playAudio("chips_large1");
    });
    socket.on("chips_large2", () => {
      game.playAudio("chips_large2");
    });
    socket.on("chips_small1", () => {
      game.playAudio("chips_small1");
    });
    socket.on("chips_small2", () => {
      game.playAudio("chips_small2");
    });
    socket.on("pokerToast", ({ message, time }) => pushToast(message, time));
  }, game.socket);

  const leftPanel = (
    <>
      <PlayerList />
      {/* All in-game actions live in the bottom action bar; only surface
          kick/vote-kick meetings here so players can still kick AFKs. */}
      <ActionList
        meetingFilter={(m) => m && /kick/i.test(m.name)}
        hideIfEmpty
      />
      <Notes />
      <SettingsMenu />
    </>
  );

  const stateViewing = game.stateViewing;
  const currentExtraInfo =
    stateViewing >= 0
      ? history?.states?.[stateViewing]?.extraInfo
      : null;
  const handHistory = currentExtraInfo?.handHistory ?? [];

  const centerPanel = (
    <div className="poker-center-panel">
      <PokerHandHistory history={handHistory} />
      <PokerTable />
      <PokerActions />
      <PokerToasts toasts={toasts} />
    </div>
  );

  return (
    <GameTypeContext.Provider
      value={{
        singleState: true,
      }}
    >
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={leftPanel}
        centerPanelContent={centerPanel}
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
            <Notes />
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-coins" />,
        }}
        innerRightContent={
          <div className="poker-center-panel">
            <PokerHandHistory history={handHistory} />
            <PokerTable />
            <PokerActions />
            <PokerToasts toasts={toasts} />
          </div>
        }
        chatTab
        hideInfoTab
      />
    </GameTypeContext.Provider>
  );
}

function PokerToasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="poker-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="poker-toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
