import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useReducer,
} from "react";
import update from "immutability-helper";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Notes,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";

import "css/game.css";
import "css/gameJotto.css";
import { Button, Stack, Typography } from "@mui/material";

const ENGLISH_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CHEATSHEET_STATES = [
  undefined,
  "success.main",
  "var(--mui-palette-error-main)",
  "var(--mui-palette-warning-main)",
];
export default function JottoGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;

  const playBellRef = useRef(false);

  const audioFileNames = [];
  const audioLoops = [];
  const audioOverrides = [];
  const audioVolumes = [];

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  // Cycle letters through "none", "correct", "wrong", "maybe"
  const [cheatSheet, updateCheatSheet] = useReducer((state, letter) => {
    if (letter === null) {
      // Let a null signal that we want to reset everything
      return update(state, {
        $set: {},
      });
    } else if (letter in state) {
      return update(state, {
        [letter]: {
          $set: (state[letter] + 1) % CHEATSHEET_STATES.length,
        },
      });
    } else {
      return update(state, {
        [letter]: {
          $set: 1,
        },
      });
    }
  }, {});

  useEffect(() => {
    game.loadAudioFiles(
      audioFileNames,
      audioLoops,
      audioOverrides,
      audioVolumes
    );
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

  const jottoCheatSheet = (
    <>
      {stateViewing >= 0 && (
        <SideMenu
          title="Cheatsheet"
          content={
            <JottoCheatSheet
              cheatSheet={cheatSheet}
              updateCheatSheet={updateCheatSheet}
            />
          }
          flex="1 0"
        />
      )}
    </>
  );

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
            {history.currentState == -1 && <PlayerList />}
            <HistoryKeeper history={history} stateViewing={stateViewing} />
            <ActionList />
            <SettingsMenu />
          </>
        }
        centerPanelContent={<TextMeetingLayout />}
        rightPanelContent={
          <>
            {jottoCheatSheet}
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
        additionalInfoContent={
          <>
            {jottoCheatSheet}
            <Notes />
          </>
        }
      />
    </GameTypeContext.Provider>
  );
}

function JottoCheatSheet({ cheatSheet, updateCheatSheet }) {
  return (
    <Stack
      direction="row"
      sx={{
        flexWrap: "wrap",
        p: 1,
        rowGap: 1,
        columnGap: 1,
        alignContent: "center",
        justifyContent: "center",
      }}
    >
      {ENGLISH_ALPHABET.map((letter) => {
        const clicks = cheatSheet[letter] || 0;

        return (
          <Button
            key={letter}
            onClick={() => updateCheatSheet(letter)}
            variant="text"
            sx={{
              position: "relative",
              minWidth: "0",
              width: "3em",
              height: "3em",
              zIndex: 1,
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: CHEATSHEET_STATES[clicks],
                border: "1px solid var(--mui-palette-primary-main)",
                borderRadius: "var(--mui-shape-borderRadius)",
                opacity: 0.5,
                zIndex: -1,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "2em",
                fontWeight: "bold",
                color: "var(--mui-palette-text-primary)",
              }}
            >
              {letter}
            </Typography>
          </Button>
        );
      })}
      <Button
        onClick={() =>
          confirm("Are you sure you want to reset all letters?") &&
          updateCheatSheet(null)
        }
        sx={{
          height: "3em",
        }}
      >
        Reset
      </Button>
    </Stack>
  );
}

function HistoryKeeper(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[props.stateViewing].extraInfo;
  return (
    <SideMenu
      title="Game Info"
      scrollable
      content={
        <>
          <JottoHistory
            guessHistoryByNames={extraInfo.guessHistoryByNames}
            turnOrder={extraInfo.turnOrder}
          />
        </>
      }
    />
  );
}

function JottoHistory(props) {
  let guessHistoryByNames = props.guessHistoryByNames;
  let turnOrder = props.turnOrder;

  return (
    <>
      <div className="jotto-history">
        {turnOrder.map((name) => (
          <JottoGuessHistoryByName
            key={name}
            name={name}
            guessHistory={guessHistoryByNames[name]}
          />
        ))}
      </div>
    </>
  );
}

function JottoGuessHistoryByName(props) {
  const name = props.name;
  const guessHistory = props.guessHistory || [];

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
  let [checked, setChecked] = useState();

  function toggleChecked() {
    setChecked(!checked);
  }

  const checkedClass = checked ? "done" : "";

  return (
    <>
      <div className="jotto-guess">
        <div className={`jotto-guess-score guess-score-${score}`}>{score}</div>
        <div
          className={`jotto-guess-word ${checkedClass}`}
          onClick={toggleChecked}
        >
          {word}
        </div>
      </div>
    </>
  );
}
