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
  PinnedMessages,
} from "./Game";
import { GameContext, SiteInfoContext } from "../../Contexts";

export default function MafiaGame() {
  const game = useContext(GameContext);
  const siteInfo = useContext(SiteInfoContext);

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
    { fileName: "music/NightCrafter", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightEssential", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightFiddler", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightInvestigator", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightLove", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightMafia", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightProtector", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightWestern", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightWinter", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightFool", loops: true, overrides: false, volumes: 0.6 },
    { fileName: "music/NightClockmaker", loops: true, overrides: false, volumes: 1 },
    { fileName: "music/NightCult", loops: true, overrides: false, volumes: 0.6 },
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

  // Play music on state change to Night
  useEffect(() => {
    if (game.review) return;

    const currentState = history.states[history.currentState];
    if (currentState && currentState.name.startsWith("Night")) {
      const currentRole = currentState.roles[self];
      if (currentRole) {
        const currentRoleName = currentRole.split(":")[0];
        const currentAlignment = currentRoleName in siteInfo.rolesRaw[gameType] ? siteInfo.rolesRaw[gameType][currentRoleName].alignment : "";

        switch (currentRoleName) {
          case "Cop":
          case "Detective":
          case "Manhunter":
          case "Tracker":
          case "Watcher":
            game.playAudio("music/NightInvestigator");
            break;
          case "Baker":
          case "Blacksmith":
          case "Chandler":
          case "Cutler":
          case "Demolitionist":
          case "Falconer":
          case "Funsmith":
          case "Gemcutter":
          case "Gunsmith":
          case "Keymaker":
          case "Knight":
          case "Mailman":
          case "Missionary": 
          case "Pharmacist":
          case "Reanimator":
          case "Capybara":
            game.playAudio("music/NightCrafter");
            break;
          case "Doctor":
          case "Surgeon":
          case "Nurse":
          case "Medic":
            game.playAudio("music/NightProtector");
            break;
          case "Sheriff":
          case "Deputy":
          case "Rival":
            game.playAudio("music/NightWestern");
            break;
          case "Mayor":
          case "Governor":
          case "President":
          case "Prince":
          case "Princess":
          case "King":
          case "Kingmaker":
          case "Queen":
            game.playAudio("music/NightEssential");
            break;
          case "Caroler":
          case "Santa":
          case "Snowman":
          case "Polar Bear":
          case "Snow Queen":
            game.playAudio("music/NightWinter");
            break;
          case "Fiddler":
            game.playAudio("music/NightFiddler");
            break;
          case "Clockmaker":
            game.playAudio("music/NightClockmaker");
            break;
          case "Clown":
          case "Fool":
          case "Joker":
          case "Trickster":
          case "Prankster":
            game.playAudio("music/NightFool");
            break;
          case "Lover":
          case "Heartbreaker":
          case "Yandere":
            game.playAudio("music/NightLove");
            break;
          default:
            if (currentAlignment === "Mafia") {
              // If mafia role isn't listed above the mafia track plays
              game.playAudio("music/NightMafia");
            }
            else if (currentAlignment === "Cult") {
              // If cult role isn't listed above then the cult track plays
              game.playAudio("music/NightCult");
            }
            else {
              console.log(`${currentRoleName} has no night music`);
            }
            break;
        }
      }
    }
    else{
        game.stopAudio();
      }
  }, [history.currentState]);

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
              setup={game.setup}
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
            {!game.review && !isSpectator && (<PinnedMessages/>)}
            {!game.review && !isSpectator && (<Notes stateViewing={stateViewing} />)}
          </>
        }
      />
    </>
  );
}
