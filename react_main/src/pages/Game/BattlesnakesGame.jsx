import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
} from "./Game";
import { GameContext } from "../../Contexts";

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

  return (
    <>
      <TopBar
        gameType={gameType}
        game={game}
        history={history}
        stateViewing={stateViewing}
        updateStateViewing={updateStateViewing}
        players={players}
        gameName={
          <div className="game-name">
            <span>Battlesnakes</span>
          </div>
        }
      />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList
              players={players}
              history={history}
              gameType={gameType}
              stateViewing={stateViewing}
              activity={game.activity}
            />
            <ActionList
              socket={game.socket}
              isParticipant={game.isParticipant}
              meetings={meetings}
              players={players}
              self={self}
              history={history}
              stateViewing={stateViewing}
            />
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
            <TextMeetingLayout
              combineMessagesFromAllMeetings
              socket={game.socket}
              history={history}
              updateHistory={updateHistory}
              players={players}
              stateViewing={stateViewing}
              settings={game.settings}
              filters={game.speechFilters}
              options={game.options}
              setup={game.setup}
              localAudioTrack={game.localAudioTrack}
            />
          </>
        }
      />
    </>
  );
}

export default React.memo(SnakeGame);
