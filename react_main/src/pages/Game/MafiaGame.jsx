import React, { useRef, useEffect, useContext, useMemo } from "react";

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
  InventoryPanel,
  buildActionDescriptors,
} from "./Game";
import { GameContext, SiteInfoContext } from "../../Contexts";
import { mafiaAudioConfig } from "../../audio/audioConfigs";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";
import { StrategiesPanel, StrategiesSection } from "components/Strategies";

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

  const baseActionProps = useMemo(
    () => ({
      socket: game.socket,
      players: game.players,
      self: game.self,
      history: game.history,
      stateViewing: game.stateViewing,
    }),
    [game.socket, game.players, game.self, game.history, game.stateViewing]
  );

  const actionDescriptorData = useMemo(
    () =>
      buildActionDescriptors({
        meetings,
        baseActionProps,
        actionStyle: {},
        inventoryActionStyle: { width: "100%" },
      }),
    [meetings, baseActionProps]
  );

  const isLiveState = history.currentState >= 0;
  const isViewingPregame = game.stateViewing === -1;
  const setupId = game.setup?.id;
  const showInventory =
    game.gameType === gameType && Boolean(game.self) && isLiveState;
  const inventoryItems =
    showInventory && game.players[game.self]
      ? game.players[game.self].inventory || []
      : [];

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    game.loadAudioFiles(mafiaAudioConfig);

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
          case "Fool":
          case "Trickster":
          case "Prankster":
            game.playAudio("music/NightFool");
            break;
          case "Joker":
            game.playAudio("music/NightJoker");
            break;
          case "Siren":
            game.playAudio("music/NightSiren");
            break;
          case "Warlock":
          case "Monk":
          case "Fatalist":
          case "Prophet":
            game.playAudio("music/NightFantasy");
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
            game.playAudio("music/NightMystical");
            break;
          case "Egg":
          case "Dodo":
          case "Turkey":
          case "Tofurkey":
          case "Harpy":
          case "Falconer":
            game.playAudio("music/NightBird");
            break;
          case "Autocrat":
          case "Palladist":
          case "Anarchist":
          case "Communist":
          case "Dragoon":
          case "Emperor":
          case "Politician":
            game.playAudio("music/NightPolitic");
            break;
          default:
            if (currentAlignment === "Mafia") {
              // If mafia role isn't listed above the mafia track plays
              game.playAudio("music/NightMafia");
            }
            else if (currentAlignment === "Cult") {
              // If cult role isn't listed above the mafia track plays
              game.playAudio("music/NightCult");
            }
            else {
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
            {isViewingPregame ? (
              <>
                {actionDescriptorData.regularActionDescriptors.length > 0 && (
                  <ActionList
                    descriptors={actionDescriptorData.regularActionDescriptors}
                  />
                )}
                <StrategiesPanel setupId={setupId} visible={Boolean(setupId)} />
              </>
            ) : (
              <ActionList
                descriptors={actionDescriptorData.regularActionDescriptors}
              />
            )}
            <InventoryPanel
              show={showInventory}
              items={inventoryItems}
              actionsByItemId={actionDescriptorData.inventoryActionDescriptors}
              gameType={gameType}
            />
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
            {isViewingPregame ? (
              <>
                {actionDescriptorData.regularActionDescriptors.length > 0 && (
                  <ActionList
                    descriptors={actionDescriptorData.regularActionDescriptors}
                  />
                )}
                <StrategiesSection
                  setupId={setupId}
                  visible={Boolean(setupId)}
                />
              </>
            ) : (
              <ActionList
                descriptors={actionDescriptorData.regularActionDescriptors}
              />
            )}
            <InventoryPanel
              show={showInventory}
              items={inventoryItems}
              actionsByItemId={actionDescriptorData.inventoryActionDescriptors}
              gameType={gameType}
            />
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
