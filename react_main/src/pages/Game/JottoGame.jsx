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
      />
      <ThreePanelLayout
        leftPanelContent={
          <>
            <HistoryKeeper history={history} stateViewing={stateViewing} />
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

  let colours = ["grey", "green", "red", "yellow"];
  let numColours = colours.length;

  function getInitialState() {
    let result = {};
    for (let row of cheatsheetRows) {
      for (let letter of row) {
        result[letter] = 0;
      }
    }

    return result;
  }

  function resetCheatsheet() {
    setCheatsheet(getInitialState());
  }

  const [cheatsheet, setCheatsheet] = useState(getInitialState());

  function getColour(letter) {
    return () => colours[cheatsheet[letter]];
  }

  function toggleCheatsheet(letter) {
    return function () {
      let newCheatsheet = cheatsheet;
      let newLetterState = (cheatsheet[letter] + 1) % numColours;
      newCheatsheet[letter] = newLetterState;
      setCheatsheet(newCheatsheet);
    };
  }

  console.log(cheatsheet["A"]);
  return (
    <>
      <div className="jotto-cheatsheet">
        {cheatsheetRows.map((row) => {
          return (
            <CheatSheetRow
              letters={row}
              getColour={getColour}
              toggleCheatsheet={toggleCheatsheet}
            />
          );
        })}
        <div className="btn jotto-cheatsheet-clear" onClick={resetCheatsheet}>
          CLEAR
        </div>
      </div>
    </>
  );
}

function CheatSheetRow(props) {
  const letters = props.letters;
  const getColour = props.getColour;
  const toggleCheatsheet = props.toggleCheatsheet;

  let rowData = [];
  for (let letter of letters) {
    rowData.push(
      <CheatSheetBox
        letter={letter}
        getColour={getColour(letter)}
        toggleCheatsheet={toggleCheatsheet(letter)}
      />
    );
  }

  return (
    <>
      <div className="jotto-cheatsheet-row">{rowData}</div>
    </>
  );
}

function CheatSheetBox(props) {
  const letter = props.letter;
  const getColour = props.getColour;
  const toggleCheatsheet = props.toggleCheatsheet;

  return (
    <>
      <div
        className={`jotto-cheatsheet-box cheatsheet-box-${getColour()}
        }`}
        key={letter}
        onClick={toggleCheatsheet}
      >
        <div className="jotto-cheatsheet-text">{letter}</div>
      </div>
    </>
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
          <JottoHistory guessHistory={extraInfo.guessHistory} />
        </>
      }
    />
  );
}

function JottoHistory(props) {
  let guessHistory = props.guessHistory;

  return (
    <>
      <div className="jotto">
        {guessHistory.map((g) => (
          <JottoGuess guess={g} />
        ))}
      </div>
    </>
  );
}

function JottoGuess(props) {
  let guess = props.guess;

  return (
    <>
      <div className="jotto-guess">
        <div className="jotto-guess-name">{guess.name}</div>
        <div className="jotto-guess-word">{guess.guess}</div>
        <div className="jotto-guess-score">{guess.score}</div>
      </div>
    </>
  );
}
