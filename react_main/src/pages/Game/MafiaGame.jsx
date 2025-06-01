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
  const audioFileNames = [];
  const audioLoops = [];
  const audioOverrides = [];
  const audioVolumes = [];

  const customAudios = [
    { fileName: "gunshot", loops: false, overrides: false, volumes: 1, },
    { fileName: "condemn", loops: false, overrides: false, volumes: 1, },
    { fileName: "explosion", loops: false, overrides: false, volumes: 0.5, },
    // { fileName: "music/NightFool", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/Draw", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinAlien", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinAnarchist", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinFool", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinMafia", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinCult", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinMatchmaker", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinKiller", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinVillage", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinAngel", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinMonk", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinSiren", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinLover", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinAstrologer", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinExecutioner", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinAutocrat", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinGambler", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinCreepyGirl", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinSidekick", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinWarlock", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinSurvivor", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinHellhound", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinMastermind", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinClockmaker", loops: false, overrides: false, volumes: 1, },
    { fileName: "music/WinProphet", loops: false, overrides: false, volumes: 1, },
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
        game.playAudio("music/WinAlien");
      }
      if (winners.groups.includes("Prophet")) {
        game.playAudio("music/WinProphet");
      }
      if (winners.groups.includes("Fool")) {
        game.playAudio("music/WinFool");
      }
      if (winners.groups.includes("Matchmaker")) {
        game.playAudio("music/WinMatchmaker");
      }
      if (winners.groups.includes("Survivor")) {
        game.playAudio("music/WinSurvivor");
      }
      if (winners.groups.includes("Serial Killer")) {
        game.playAudio("music/WinKiller");
      }
      if (winners.groups.includes("Cult")) {
        game.playAudio("music/WinCult");
      }
      if (winners.groups.includes("Village")) {
        game.playAudio("music/WinVillage");
      }
      if (winners.groups.includes("Angel")) {
        game.playAudio("music/WinAngel");
      }
      if (winners.groups.includes("Siren")) {
        game.playAudio("music/WinSiren");
      }
      if (winners.groups.includes("Monk")) {
        game.playAudio("music/WinMonk");
      }
      if (winners.groups.includes("Lover")) {
        game.playAudio("music/WinLover");
      }
      if (winners.groups.includes("Astrologer")) {
        game.playAudio("music/WinAstrologer");
      }
      if (winners.groups.includes("Hellhound")) {
        game.playAudio("music/WinHellhound");
      }
      if (winners.groups.includes("Warlock")) {
        game.playAudio("music/WinWarlock");
      }
      if (winners.groups.includes("Creepy Girl")) {
        game.playAudio("music/WinCreepyGirl");
      }
      if (winners.groups.includes("Autocrat")) {
        game.playAudio("music/WinAutocrat");
      }
      if (winners.groups.includes("Gambler")) {
        game.playAudio("music/WinGambler");
      }
      if (winners.groups.includes("Sidekick")) {
        game.playAudio("music/WinSidekick");
      }
      if (winners.groups.includes("Executioner")) {
        game.playAudio("music/WinExecutioner");
      }
      if (winners.groups.includes("Clockmaker")) {
        game.playAudio("music/WinClockmaker");
      }
      if (winners.groups.includes("Mastermind")) {
        game.playAudio("music/WinMastermind");
      }
      if (winners.groups.includes("Anarchist")) {
        game.playAudio("music/WinAnarchist");
      }
      if (winners.groups.includes("Mafia")) {
        game.playAudio("music/WinMafia");
      } else if (winners.groups.includes("No one")) {
        game.playAudio("music/Draw");
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
    // night music
    // socket.on("NightFool", () => {
    //     game.playAudio("music/NightFool");
    // });
  }, game.socket);

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
