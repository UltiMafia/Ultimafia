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
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/gameAcrotopia.css";

export default function AcrotopiaGame(props) {
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

  const gameType = "Acrotopia";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  /*
  const stateEvents = history.states[stateViewing]
    ? history.states[stateViewing].stateEvents
    : [];
  const stateNames = ["Night", "Day"];
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
      <TopBar hideStateSwitcher />
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
            <Notes />
          </>
        }
      />
      <MobileLayout
        innerRightContent={
          <>
            <HistoryKeeper history={history} stateViewing={stateViewing} />
            <ActionList />
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
          <AcrotopiaHistory
            acronymHistory={extraInfo.acronymHistory}
            currentAcronym={extraInfo.currentAcronym}
            scores={extraInfo.scores}
            round={extraInfo.round}
            totalRound={extraInfo.totalRound}
            playerHasVoted={extraInfo.playerHasVoted}
          />
        </>
      }
    />
  );
}

function AcrotopiaHistory(props) {
  let acronymHistory = props.acronymHistory;
  let currentAcronym = props.currentAcronym;
  let scores = props.scores;
  let round = props.round;
  let totalRound = props.totalRound;
  let playerHasVoted = props.playerHasVoted;

  return (
    <>
      <div className="acrotopia">
        <div className="acrotopia-word-info">
          <>
            <div className="acrotopia-name">
              Round {round} of {totalRound}{" "}
            </div>
          </>
        </div>
        <div className="acrotopia-word-info">
          <>
            <div className="acrotopia-name">Current Acronym</div>
            <div className="acrotopia-input">{currentAcronym}</div>
          </>
        </div>
        <div className="acrotopia-current-history">
          <div className="acrotopia-name">Current Backronyms</div>
          <AcronymHistory acronymHistory={acronymHistory} />
        </div>
        <div className="acrotopia-scores">
          <div className="acrotopia-name">Current Score</div>
          <div className="acrotopia-scores-wrapper">
            {Object.keys(scores).map((name) => {
              return (
                <AcrotopiaScore
                  name={name}
                  score={scores[name]}
                  hasVoted={playerHasVoted[name]}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function AcronymHistory(props) {
  let acronymHistory = props.acronymHistory;

  return (
    <>
      <div className="acrotopia-history-group">
        {acronymHistory.map((a) => {
          return <Acronym acronym={a} />;
        })}
      </div>
    </>
  );
}

function Acronym(props) {
  let a = props.acronym;
  return (
    <>
      <div className="acrotopia-input acrotopia-tick">
        <span> {a.display} </span> {a.name}
      </div>
    </>
  );
}

function AcrotopiaScore(props) {
  let name = props.name;
  let score = props.score;
  let hasVoted = props.hasVoted;

  return (
    <>
      <div className="acrotopia-score">
        <div className="acrotopia-voted-check">
          {hasVoted && <i className="fas fa-check" />}
        </div>
        <div className="acrotopia-score-data acrotopia-score-score">
          {score}
        </div>
        <div className="acrotopia-score-data acrotopia-score-name">{name}</div>
      </div>
    </>
  );
}
