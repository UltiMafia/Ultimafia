import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  // useStateViewingReducer,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  LastWillEntry,
  Timer,
  SpeechFilter,
  SettingsMenu,
  Notes,
  PinnedMessages,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext, SiteInfoContext } from "../../Contexts";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export default function MafiaGame() {
  const game = useContext(GameContext);
  const siteInfo = useContext(SiteInfoContext);
  const isPhoneDevice = useIsPhoneDevice();

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
  const audioFileNames = [];
  const audioLoops = [];
  const audioOverrides = [];
  const audioVolumes = [];

  const customAudios = [
    { fileName: "gunshot", loops: false, overrides: false, volumes: 1 },
    { fileName: "ghostAsk", loops: false, overrides: false, volumes: 1 },
    { fileName: "condemn", loops: false, overrides: false, volumes: 1 },
    { fileName: "explosion", loops: false, overrides: false, volumes: 0.5 },
    { fileName: "snowball", loops: false, overrides: false, volumes: 0.5 },
    {
      fileName: "music/NightCrafter",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightEssential",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightFiddler",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightInvestigator",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/NightLove", loops: true, overrides: false, volumes: 1 },
    {
      fileName: "music/NightMystical",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/NightMafia", loops: true, overrides: false, volumes: 1 },
    {
      fileName: "music/NightProtector",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightWestern",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightWinter",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightFool",
      loops: true,
      overrides: false,
      volumes: 0.6,
    },
    {
      fileName: "music/NightClockmaker",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightPyromaniac",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightHostile",
      loops: true,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/NightGeneric",
      loops: true,
      overrides: false,
      volumes: 0.6,
    },
    { fileName: "music/Draw", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinAlien", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinBlob", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/WinCommunist",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/WinDodo", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinJoker", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/WinPuppeteer",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinPyromaniac",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinGreyGoo",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/WinFool", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinMafia", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinCult", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/WinMatchmaker",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/WinKiller", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/WinVillage",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    { fileName: "music/WinAngel", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinMonk", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinSiren", loops: false, overrides: false, volumes: 1 },
    { fileName: "music/WinLover", loops: false, overrides: false, volumes: 1 },
    {
      fileName: "music/WinAstrologer",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinExecutioner",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinAutocrat",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinGambler",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinCreepyGirl",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinSidekick",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinWarlock",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinSurvivor",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinHellhound",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinMastermind",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinClockmaker",
      loops: false,
      overrides: false,
      volumes: 1,
    },
    {
      fileName: "music/WinProphet",
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

  // Play music on state change to Night
  useEffect(() => {
    if (game.review) return;

    const currentState = history.states[history.currentState];
    if (currentState && currentState.name.startsWith("Night")) {
      const currentRole = currentState.roles[self];
      if (currentRole) {
        const currentRoleName = currentRole.split(":")[0];
        const currentAlignment =
          currentRoleName in siteInfo.rolesRaw[gameType]
            ? siteInfo.rolesRaw[gameType][currentRoleName].alignment
            : "";

        switch (currentRoleName) {
          case "Cop":
          case "Detective":
          case "Manhunter":
          case "Tracker":
          case "Watcher":
            game.playAudio("music/NightInvestigator");
            break;
          case "Baker":
          case "Barista":
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
          case "Dentist":
            game.playAudio("music/NightProtector");
            break;
          case "Sheriff":
          case "Deputy":
          case "Rival":
            game.playAudio("music/NightWestern");
            break;
          case "Mayor":
          case "Governor":
          case "Senator":
          case "President":
          case "Prince":
          case "Princess":
          case "King":
          case "Kingmaker":
          case "Queen":
          case "Judge":
            game.playAudio("music/NightEssential");
            break;
          case "Caroler":
          case "Santa":
          case "Snowman":
          case "Polar Bear":
          case "Snow Queen":
          case "Matchmaker":
            game.playAudio("music/NightWinter");
            break;
          case "Fiddler":
            game.playAudio("music/NightFiddler");
            break;
          case "Clockmaker":
            game.playAudio("music/NightClockmaker");
            break;
          case "Pyromaniac":
            game.playAudio("music/NightPyromaniac");
            break;
          case "Serial Killer":
          case "Mastermind":
          case "Usurper":
          case "Mutineer":
          case "Hellhound":
          case "Grizzly Bear":
          case "Puppeteer":
          case "Supervillain":
            game.playAudio("music/NightHostile");
            break;
          case "Clown":
          case "Dodo":
          case "Fool":
          case "Joker":
          case "Trickster":
          case "Prankster":
            game.playAudio("music/NightFool");
            break;
          case "Suitress":
          case "Mistress":
          case "Lover":
          case "Astrologer":
          case "Heartbreaker":
          case "Yandere":
            game.playAudio("music/NightLove");
            break;
          case "Oracle":
          case "Resurrectionist":
          case "Diviner":
          case "Psychic":
          case "Medium":
          case "Mourner":
          case "Fortune Teller":
          case "Clairvoyant":
          case "Groundskeeper":
          case "Mooncalf":
          case "Graverobber":
          case "Ghostbuster":
          case "Poltergeist":
          case "Banshee":
          case "Ghost":
          case "Vengeful Spirit":
          case "Phantom":
          case "Alien":
          case "Blob":
          case "Doppelgänger":
          case "Grey Goo":
          case "Prophet":
          case "Fatalist":
            game.playAudio("music/NightMystical");
            break;
          default:
            if (currentAlignment === "Mafia") {
              // If mafia role isn't listed above the mafia track plays
              game.playAudio("music/NightMafia");
            } else {
              // If no role has assigned music the generic track plays
              game.playAudio("music/NightGeneric");
            }
            break;
        }
      }
    } else if (
      currentState &&
      (currentState.name.startsWith("Give Clue") ||
        currentState.name.startsWith("Dawn"))
    ) {
      //Night Music Contiunes at Give Clue and Dawn
    } else {
      game.stopAudio();
    }
  }, [history.currentState]);

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (state && state.name && state.name.startsWith("Give Clue")) {
      } else if (playBellRef.current) {
        game.playAudio("bell");
      }

      playBellRef.current = true;
    });

    socket.on("winners", (winners) => {
      game.stopAudio();
      if (winners.groups.includes("Alien")) {
        game.playAudio("music/WinAlien");
      }
      if (winners.groups.includes("Blob")) {
        game.playAudio("music/WinBlob");
      }
      if (winners.groups.includes("Prophet")) {
        game.playAudio("music/WinProphet");
      }
      if (winners.groups.includes("Fool")) {
        game.playAudio("music/WinFool");
      }
      if (winners.groups.includes("Dodo")) {
        game.playAudio("music/WinDodo");
      }
      if (winners.groups.includes("Joker")) {
        game.playAudio("music/WinJoker");
      }
      if (winners.groups.includes("Puppeteer")) {
        game.playAudio("music/WinPuppeteer");
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
      if (winners.groups.includes("Communist")) {
        game.playAudio("music/WinCommunist");
      }
      if (winners.groups.includes("Pyromaniac")) {
        game.playAudio("music/WinPyromaniac");
      }
      if (winners.groups.includes("Grey Goo")) {
        game.playAudio("music/WinGreyGoo");
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
    socket.on("giveClue", (player) => {
      if (player == self) {
        game.playAudio("ghostAsk");
      }
    });
    socket.on("condemn", () => {
      game.playAudio("condemn");
    });
    socket.on("explosion", () => {
      game.playAudio("explosion");
    });
    socket.on("snowball", () => {
      game.playAudio("snowball");
    });
  }, game.socket);

  return (
    <GameTypeContext.Provider
      value={{
        singleState: false,
      }}
    >
      <TopBar />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <PlayerList />
            <SpeechFilter />
            <SettingsMenu />
          </>
        }
        centerPanelContent={<TextMeetingLayout />}
        rightPanelContent={
          <>
            <HistoryKeeper history={history} stateViewing={stateViewing} />
            <ActionList />
            <LastWillEntry />
            <PinnedMessages />
            <Notes />
          </>
        }
      />
      <MobileLayout
        outerLeftContent={
          <>
            <PlayerList />
            <SpeechFilter />
          </>
        }
        innerRightContent={
          <>
            <HistoryKeeper history={history} stateViewing={stateViewing} />
            <ActionList />
            <LastWillEntry />
          </>
        }
        additionalInfoContent={
          <>
            <PinnedMessages />
            <Notes />
          </>
        }
      />
    </GameTypeContext.Provider>
  );
}

function HistoryKeeper(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  if (!extraInfo || extraInfo.showGameInfo !== true) {
    return <></>;
  }

  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <>
          <GhostHistory
            //responseHistory={extraInfo.responseHistory}
            currentClueHistory={extraInfo.currentClueHistory}
            word={extraInfo.word}
            wordLength={extraInfo.wordLength}
          />
        </>
      }
    />
  );
}

function GhostHistory(props) {
  //let responseHistory = props.responseHistory;
  let currentClueHistory = props.currentClueHistory;
  let wordLength = props.wordLength;

  return (
    <div className="ghost">
      <div className="ghost-word-info">
        <>
          <div className="ghost-name"> Word Length </div>
          <div className="ghost-input"> {wordLength} </div>
        </>
      </div>
      <div className="ghost-current-history">
        <div className="ghost-name"> Current Round </div>
        <ClueHistory clueHistory={currentClueHistory} />
      </div>
    </div>
  );
}

function ClueHistory(props) {
  let clueHistory = props.clueHistory;

  return (
    <>
      <div className="ghost-history-group">
        {clueHistory.map((c) => (
          <Clue clue={c} />
        ))}
      </div>
    </>
  );
}

function Clue(props) {
  let c = props.clue;

  return (
    <>
      <div className="ghost-input ghost-clue">
        <span> {c.split(":")[0]} </span> {c.split(":")[1]}
      </div>
    </>
  );
}
