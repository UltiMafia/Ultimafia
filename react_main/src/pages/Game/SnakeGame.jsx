import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  BotBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  SpeechFilter,
  SettingsMenu,
  Notes,
} from "./Game";
import { GameContext } from "../../Contexts";

import "../../css/gameGhost.css";
import { SnakeGameType } from "../../Constants";
import SnakeGameDisplay from "./SnakeGameDisplay";

function SnakeGame(props) {
  const game = useContext(GameContext);
  const history = game.history;
  const updateHistory = game.updateHistory;
  // const updatePlayers = game.updatePlayers;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;

  const playBellRef = useRef(false);

  const gameType = SnakeGameType;
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  /*
  const stateEvents = history.states[stateViewing]
    ? history.states[stateViewing].stateEvents
    : [];
  const stateNames = ["Night", "Give Clue", "Day", "Guess Word"];
  */
  const audioFileNames = [];
  const audioLoops = [];
  const audioOverrides = [];
  const audioVolumes = [];

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
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;

      // for (let stateName of stateNames)
      // 	if (state.name.indexOf(stateName) == 0)
      // 		game.playAudio(stateName);
    });

    socket.on("winners", (winners) => {
      // game.stopAudios(stateNames);
      // if (winners.groups.indexOf("Resistance") != -1)
      // 	game.playAudio("resistancewin");
      // else
      // 	game.playAudio("spieswin");
    });

    socket.on("gameState", (state) => {
      console.log(state);
    });
  }, game.socket);

  console.log(stateViewing);

  return (
    <>
      <BotBar
        gameType={gameType}
        setup={game.setup}
        history={history}
        stateViewing={stateViewing}
        updateStateViewing={updateStateViewing}
        players={players}
        socket={game.socket}
        options={game.options}
        spectatorCount={game.spectatorCount}
        setLeave={game.setLeave}
        finished={game.finished}
        review={game.review}
        setRehostId={game.setRehostId}
        noLeaveRef={game.noLeaveRef}
        dev={game.dev}
        gameName={
          <div className="game-name">
            <span>Snake</span>
          </div>
        }
        timer={<Timer timers={game.timers} history={history} />}
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
