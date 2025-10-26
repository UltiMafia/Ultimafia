import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/gameBattlesnakes.css";
import SnakeGameDisplay from "./SnakeGameDisplay";

function SnakeGame(props) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

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
    alert("Battlesnakes is not presently supported on mobile devices.");
    return <></>;
  }

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
            <ActionList />
          </>
        }
        centerPanelContent={
          <>
            {players && game.socket && (
              <SnakeGameDisplay
                player={self}
                players={players}
                gameSocket={game.socket}
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
    </GameTypeContext.Provider>
  );
}

export default React.memo(SnakeGame);
