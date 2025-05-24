import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  // useStateViewingReducer,
  ThreePanelLayout,
  BotBar,
  TextMeetingLayout,
  getUnresolvedActionCount,
  ActionList,
  PlayerList,
  LastWillEntry,
  Timer,
  SpeechFilter,
  SettingsMenu,
  Notes,
} from "./Game";
import { GameContext } from "../../Contexts";

export default function MafiaGame() {
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

  const gameType = "Mafia";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  /*
  const stateEvents = history.states[stateViewing]
    ? history.states[stateViewing].stateEvents
    : [];
  const stateNames = ["Day", "Night", "Sunset"];
  */
  const audioFileNames = [
    /*"Day", "Night", "Sunset", "nonvillagewin", "villagewin", */ "gunshot",
    "condemn",
    "explosion",
  ];
  const audioLoops = [/*true, true, true, */ false, false, false, false];
  const audioOverrides = [/*true, true, true, */ false, false, false, false];
  const audioVolumes = [/*1, 1, 1, */ 1, 1, 1, 0.5];

  const customAudios = [
    { fileName: "music/Alien", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/Anarchist",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/Fool", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Mafia", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/Cultist",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/Matchmaker",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/Killer", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Village", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Angel", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Monk", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Siren", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Lover", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Cupid", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/Executioner",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/Autocrat", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Gambler", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/CreepyGirl",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/Sidekick", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/Warlock", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/Survivor",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/Hellhound",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/Mastermind",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/Clockmaker",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/Prophet",
      loops: false,
      overrides: false,
      volumes: 1,
    },
  ];

  customAudios.forEach((e) => {
    audioFileNames.push(e.fileName);
    audioLoops.push(e.loops);
    audioOverrides.push(e.overrides);
    audioVolumes.push(e.volumes);
  });

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
      if (playBellRef.current) game.playAudio("bell");

      playBellRef.current = true;

      // for (let stateName of stateNames)
      // 	if (state.name.indexOf(stateName) == 0)
      // 		game.playAudio(stateName);
    });

    socket.on("winners", (winners) => {
      game.stopAudio();
      if (winners.groups.includes("Alien")) {
        game.playAudio("music/Alien");
      }
      if (winners.groups.includes("Prophet")) {
        game.playAudio("music/Prophet");
      }
      if (winners.groups.includes("Fool")) {
        game.playAudio("music/Fool");
      }
      if (winners.groups.includes("Matchmaker")) {
        game.playAudio("music/Matchmaker");
      }
      if (winners.groups.includes("Survivor")) {
        game.playAudio("music/Survivor");
      }
      if (winners.groups.includes("Serial Killer")) {
        game.playAudio("music/Killer");
      }
      if (winners.groups.includes("Cult")) {
        game.playAudio("music/Cultist");
      }
      if (winners.groups.includes("Village")) {
        game.playAudio("music/Village");
      }
      if (winners.groups.includes("Angel")) {
        game.playAudio("music/Angel");
      }
      if (winners.groups.includes("Siren")) {
        game.playAudio("music/Siren");
      }
      if (winners.groups.includes("Monk")) {
        game.playAudio("music/Monk");
      }
      if (winners.groups.includes("Lover")) {
        game.playAudio("music/Lover");
      }
      if (winners.groups.includes("Astrologer")) {
        game.playAudio("music/Cupid");
      }
      if (winners.groups.includes("Hellhound")) {
        game.playAudio("music/Hellhound");
      }
      if (winners.groups.includes("Warlock")) {
        game.playAudio("music/Warlock");
      }
      if (winners.groups.includes("Creepy Girl")) {
        game.playAudio("music/CreepyGirl");
      }
      if (winners.groups.includes("Autocrat")) {
        game.playAudio("music/Autocrat");
      }
      if (winners.groups.includes("Gambler")) {
        game.playAudio("music/Gambler");
      }
      if (winners.groups.includes("Sidekick")) {
        game.playAudio("music/Sidekick");
      }
      if (winners.groups.includes("Executioner")) {
        game.playAudio("music/Executioner");
      }
      if (winners.groups.includes("Clockmaker")) {
        game.playAudio("music/Clockmaker");
      }
      if (winners.groups.includes("Mastermind")) {
        game.playAudio("music/Mastermind");
      }
      if (winners.groups.includes("Anarchist")) {
        game.playAudio("music/Anarchist");
      }
      if (winners.groups.includes("Mafia")) {
        game.playAudio("music/Mafia");
      } else {
        game.playAudio("nonvillagewin");
      }
    });

    socket.on("gunshot", () => {
      game.playAudio("gunshot");
    });
    socket.on("condemn", () => {
      game.playAudio("condemn");
    });
    socket.on("explosion", () => {
      game.playAudio("explosion");
    });
  }, game.socket);

  const unresolvedActionCount = getUnresolvedActionCount(meetings);

  return (
    <>
      <BotBar
        gameType={gameType}
        game={game}
        history={history}
        stateViewing={stateViewing}
        updateStateViewing={updateStateViewing}
        players={players}
        gameName={<div className="game-name">Mafia</div>}
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
              self={self}
              activity={game.activity}
            />
            <SpeechFilter
              filters={game.speechFilters}
              setFilters={game.setSpeechFilters}
              stateViewing={stateViewing}
            />
            <SettingsMenu
              settings={game.settings}
              updateSettings={game.updateSettings}
              showMenu={game.showMenu}
              setShowMenu={game.setShowMenu}
              stateViewing={stateViewing}
            />
          </>
        }
        centerPanelContent={
          <>
            <TextMeetingLayout
              socket={game.socket}
              history={history}
              updateHistory={updateHistory}
              players={players}
              stateViewing={stateViewing}
              settings={game.settings}
              filters={game.speechFilters}
              review={game.review}
              options={game.options}
              setup={game.setup}
              setTyping={game.setTyping}
              localAudioTrack={game.localAudioTrack}
            />
          </>
        }
        rightPanelContent={
          <>
            <ActionList
              socket={game.socket}
              meetings={meetings}
              players={players}
              self={self}
              history={history}
              stateViewing={stateViewing}
            />
            {!game.review &&
              !isSpectator &&
              history.currentState >= 0 &&
              game.setup.lastWill && (
                <LastWillEntry
                  lastWill={game.lastWill}
                  cannotModifyLastWill={history.states[
                    history.currentState
                  ].name.startsWith("Day")}
                  socket={game.socket}
                />
              )}
            {!game.review && !isSpectator && (
              <Notes stateViewing={stateViewing} />
            )}
          </>
        }
      />
    </>
  );
}
