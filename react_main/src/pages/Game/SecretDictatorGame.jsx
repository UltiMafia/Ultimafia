import React, { useRef, useEffect, useContext } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  SpeechFilter,
  SettingsMenu,
  Notes,
  PinnedMessages,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/game.css";
import "css/gameSecretDictator.css";

export default function SecretDictatorGame(props) {
  const game = useContext(GameContext);
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

  const gameType = "Secret Dictator";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  /*
  const stateEvents = history.states[stateViewing]
    ? history.states[stateViewing].stateEvents
    : [];
  const stateNames = [
    "Nomination",
    "Election",
    "Legislative Session",
    "Executive Action",
    "Special Nomination",
  ];
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
            <SpeechFilter />
            <SettingsMenu />
          </>
        }
        centerPanelContent={<TextMeetingLayout />}
        rightPanelContent={
          <>
            <HistoryKeeper history={history} stateViewing={stateViewing} />
            <ActionList />
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

  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <>
          <SecretDictatorHistory
            deckInfo={extraInfo.deckInfo}
            policyInfo={extraInfo.policyInfo}
            electionInfo={extraInfo.electionInfo}
            candidateInfo={extraInfo.candidateInfo}
            presidentialPowersBoard={extraInfo.presidentialPowersBoard}
          />
        </>
      }
    />
  );
}

function SecretDictatorHistory(props) {
  const {
    deckInfo,
    policyInfo,
    electionInfo,
    candidateInfo,
    presidentialPowersBoard,
  } = props;

  return (
    <>
      <div class="secret-dictator">
        <PolicyTracker policyInfo={policyInfo} />
        <ElectionTracker electionInfo={electionInfo} />
        <CandidateTracker candidateInfo={candidateInfo} />
        <PresidentialPowersBoard board={presidentialPowersBoard} />
        <DeckTracker deckInfo={deckInfo} />
      </div>
    </>
  );
}

function DeckTracker(props) {
  const {
    startDeckLiberal,
    startDeckFascist,
    deckSize,
    discardSize,
    refreshSize,
  } = props.deckInfo;

  return (
    <div className="deck-info">
      <div className="initial-info">
        <div className="game-info-section-title">Initial Deck Info</div>
        <div className="game-info-section-values-wrapper">
          <div className="game-info-value">
            <span className="initial-info-liberal"> {startDeckLiberal} </span>{" "}
            Liberal
          </div>
          <div className="game-info-value">
            <span className="initial-info-fascist"> {startDeckFascist} </span>{" "}
            Fascist
          </div>
          <div className="game-info-value">
            Refresh Size:{" "}
            <span className="initial-info-refresh"> {refreshSize} </span>
          </div>
        </div>
      </div>
      <div className="current-info">
        <div className="game-info-section-title">Current Deck Size</div>
        <div className="game-info-section-values-wrapper">
          <div className="game-info-value">
            <span className="count"> {deckSize} </span> Draw Pile
          </div>
          <div className="game-info-value">
            <span className="count"> {discardSize} </span> Discard Pile
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyTracker(props) {
  const liberal = props.policyInfo.liberalPolicyCount;
  const fascist = props.policyInfo.fascistPolicyCount;

  return (
    <>
      <div class="policies-tracker">
        <div className="game-info-section-title">Enacted Policies</div>
        <div className="game-info-section-values-wrapper">
          <div className="game-info-value">
            <span className="count"> {liberal} </span> Liberal
          </div>
          <div className="game-info-value">
            <span className="count"> {fascist} </span> Fascist
          </div>
        </div>
      </div>
    </>
  );
}

function ElectionTracker(props) {
  const electionTracker = props.electionInfo.electionTracker;
  const vetoUnlocked = props.electionInfo.vetoUnlocked;

  return (
    <>
      <div className="election-tracker">
        <div className="election-tracker-section failed-election-tracker">
          <div className="game-info-section-title">Election Tracker</div>
          <div className="game-info-value">
            <span> {electionTracker} </span> failed
          </div>
        </div>
        <div className="election-tracker-section veto-unlocked">
          <div className="game-info-section-title">Veto Unlocked?</div>
          <div className="game-info-value">{vetoUnlocked ? "Yes" : "No"}</div>
        </div>
      </div>
    </>
  );
}

function CandidateTracker(props) {
  const {
    lastElectedPresident,
    lastElectedChancellor,
    presidentialNominee,
    chancellorNominee,
  } = props.candidateInfo;

  return (
    <>
      <div className="candidate-tracker">
        {lastElectedPresident && (
          <CandidateTrackerSection
            title="Last Elected"
            president={lastElectedPresident}
            chancellor={lastElectedChancellor}
          />
        )}
        {presidentialNominee && (
          <CandidateTrackerSection
            title="Current Nominees"
            president={presidentialNominee}
            chancellor={chancellorNominee}
          />
        )}
      </div>
    </>
  );
}

function CandidateTrackerSection(props) {
  const title = props.title;
  const president = props.president;
  const chancellor = props.chancellor;

  return (
    <>
      <div className="candidate-tracker-section">
        <div className="game-info-section-title">{title}</div>
        <div className="game-info-section-values-wrapper">
          <div className="game-info-value president">
            President: <span>{president}</span>
          </div>
          <div className="game-info-value chancellor">
            Chancellor: <span>{chancellor}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function PresidentialPowersBoard(props) {
  const board = props.board;
  const boardSize = 6;

  const boardParsed = [];
  for (let i = 1; i < boardSize + 1; i++) {
    if (board[i]) {
      boardParsed.push(<BoardBox idx={i} power={board[i] || ""} />);
    }
  }

  return (
    <>
      <div className="power-board">
        <div className="game-info-section-title">
          Presidential Powers (at X Fascist policies)
        </div>
        {boardParsed}
      </div>
    </>
  );
}

function BoardBox(props) {
  const idx = props.idx;
  const power = props.power;

  return (
    <>
      <div className="game-info-section-values-wrapper board-box">
        <div className="game-info-value board-idx">{idx}</div>
        <div className="game-info-value board-power">{power}</div>
      </div>
    </>
  );
}
