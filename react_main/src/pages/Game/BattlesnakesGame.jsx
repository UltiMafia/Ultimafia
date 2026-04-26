import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  PlayerList,
  ActionList,
  MobileLayout,
  Timer,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { battlesnakesAudioConfig } from "../../audio/audioConfigs";

import "css/gameBattlesnakes.css";
import SnakeGameDisplay from "./SnakeGameDisplay";

function SnakeGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;

  const gameType = "Battlesnakes";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(battlesnakesAudioConfig);

    // Make game review start at the final state (shows the board)
    if (game.review) updateStateViewing({ type: "current" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("start", () => {
      game.playAudio("music/14_Minigame");
    });

    socket.on("winners", () => {
      game.stopAudio();
    });
  }, game.socket);

  return (
    <GameTypeContext.Provider
      value={{
        singleState: true,
      }}
    >
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList />
          </>
        }
        centerPanelContent={
          <>
            {players && (
              <SnakeGameDisplay
                player={self}
                players={players}
                gameSocket={!game.review ? game.socket : undefined}
                extraInfo={history.states[stateViewing]?.extraInfo}
              />
            )}
          </>
        }
        rightPanelContent={
          <>
            <TextMeetingLayout />
          </>
        }
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
            <ActionList
              meetingFilter={(m) => m.name === "Vote Kick"}
              hideIfEmpty
              scrollable={false}
            />
          </>
        }
        innerRightContent={
          <>
            {players && (
              <SnakeGameDisplay
                player={self}
                players={players}
                gameSocket={!game.review ? game.socket : undefined}
                extraInfo={history.states[stateViewing]?.extraInfo}
              />
            )}
          </>
        }
        innerRightNavigationProps={{
          label: "Board",
          value: "actions",
          icon: <i className="fas fa-th" />,
        }}
      />
    </GameTypeContext.Provider>
  );
}

export default React.memo(SnakeGame);
