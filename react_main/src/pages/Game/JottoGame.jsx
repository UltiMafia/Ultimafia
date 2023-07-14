import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  SpeechFilter,
  Notes,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";

import "../../css/game.css";
import "../../css/gameJotto.css";

export default function JottoGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateHistory = game.updateHistory;
  const updatePlayers = game.updatePlayers;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;

  const playBellRef = useRef(false);

  const gameType = "Jotto";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  const stateEvents = history.states[stateViewing]
    ? history.states[stateViewing].stateEvents
    : [];
  const stateNames = ["Select Word", "Guess Word"];
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
    <>
      <TopBar
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
        setShowSettingsModal={game.setShowSettingsModal}
        setRehostId={game.setRehostId}
        noLeaveRef={game.noLeaveRef}
        dev={game.dev}
        gameName={
          <div className="game-name">
            <span>Jotto</span>
          </div>
        }
        timer={<Timer timers={game.timers} history={history} />}
        hideStateSwitcher
      />
      <ThreePanelLayout
        leftPanelContent={
          <>
            {stateViewing == -1 &&
              <PlayerList
                players={players}
                history={history}
                gameType={gameType}
                stateViewing={stateViewing}
                activity={game.activity}
              />
            }
            <HistoryKeeper
              players={players}
              history={history}
              stateViewing={stateViewing}
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
              // agoraClient={game.agoraClient}
              localAudioTrack={game.localAudioTrack}
              setActiveVoiceChannel={game.setActiveVoiceChannel}
              muted={game.muted}
              setMuted={game.setMuted}
              deafened={game.deafened}
              setDeafened={game.setDeafened}
            />
          </>
        }
        rightPanelContent={
          <>
            <JottoCheatSheetWrapper stateViewing={stateViewing} />
            {!isSpectator && <Notes stateViewing={stateViewing} />}
          </>
        }
      />
    </>
  );
}

function JottoCheatSheetWrapper(props) {
  const stateViewing = props.stateViewing;

  if (stateViewing < 0) return <></>;

  return (
    <SideMenu
      title="Cheatsheet"
      scrollable
      content={
        <>
          <JottoCheatSheet />
        </>
      }
    />
  );
}

function JottoCheatSheet() {
  let cheatsheetRows = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "Z"];

  let enableReset = false;
  function resetCheatsheet() {}

  return (
    <>
      <div className="jotto-cheatsheet">
        {cheatsheetRows.map((row) => {
          return <CheatSheetRow letters={row} />;
        })}
        {enableReset && 
          <div className="btn jotto-cheatsheet-clear" onClick={resetCheatsheet}>
            CLEAR
          </div>
        }     
      </div>
    </>
  );
}

function CheatSheetRow(props) {
  const letters = props.letters;

  let rowData = [];
  for (let letter of letters) {
    rowData.push(<CheatSheetBox letter={letter} />);
  }

  return (
    <>
      <div className="jotto-cheatsheet-row">{rowData}</div>
    </>
  );
}

function CheatSheetBox(props) {
  const [numClicks, setNumClicks] = useState(0);
  const letter = props.letter;

  let boxState = ["none", "correct", "wrong", "maybe"];
  const getBoxState = () => boxState[numClicks % boxState.length];
  const clickBox = () => {
    setNumClicks(numClicks + 1);
  };

  return (
    <>
      <div
        className={`jotto-cheatsheet-box cheatsheet-box-${getBoxState()}
        }`}
        key={letter}
        onClick={clickBox}
      >
        <div className="jotto-cheatsheet-text">{letter}</div>
      </div>
    </>
  );
}

function HistoryKeeper(props) {
  const players = props.players;
  const history = props.history;
  const stateViewingInfo = history.states[props.stateViewing];

  const stateViewing = props.stateViewing;

  if (stateViewing < 0) return <></>;

  const extraInfo = stateViewingInfo.extraInfo;
  const alivePlayers = Object.values(props.players).filter(
    (p) => !stateViewingInfo.dead[p.id] && !p.left
  );

  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <>
          <JottoHistory
            players={alivePlayers}
            guessHistory={extraInfo.guessHistory}
          />
        </>
      }
    />
  );
}

function JottoHistory(props) {
  let players = props.players;
  let guessHistory = props.guessHistory;

  let guessHistoryByName = {};
  for (let p in players) {
    guessHistoryByName[players[p].name] = [];
  }

  for (let guess of guessHistory) {
    guessHistoryByName[guess.name].push({
      word: guess.word,
      score: guess.score,
    });
  }

  let guessHistoryByNames = [];
  for (let name in guessHistoryByName) {
    guessHistoryByNames.push(
      <JottoGuessHistoryByName
        name={name}
        guessHistory={guessHistoryByName[name]}
      />
    );
  }

  return (
    <>
      <div className="jotto-history">{guessHistoryByNames}</div>
    </>
  );
}

function JottoGuessHistoryByName(props) {
  const name = props.name;
  const guessHistory = props.guessHistory;

  return (
    <>
      <div className="jotto-guess-history">
        <div className="jotto-guess-history-name">{name.slice(0, 10)}</div>
        <div className="jotto-guess-history-guesses">
          {guessHistory.map((g) => (
            <JottoGuess word={g.word} score={g.score} />
          ))}
        </div>
      </div>
    </>
  );
}

function JottoGuess(props) {
  let word = props.word;
  let score = props.score;

  return (
    <>
      <div className="jotto-guess">
        <div className={`jotto-guess-score guess-score-${score}`}>{score}</div>
        <div className="jotto-guess-word">{word}</div>
      </div>
    </>
  );
}
