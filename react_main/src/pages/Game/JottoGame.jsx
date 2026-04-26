import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useReducer,
  useMemo,
} from "react";
import update from "immutability-helper";

import {
  useSocketListeners,
  TopBar,
  TextMeetingLayout,
  ActionList,
  buildActionDescriptors,
  PlayerList,
  Notes,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";
import { Avatar } from "../User/User";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/game.css";
import "css/gameJotto.css";
import { Button, Stack, TextField, Typography } from "@mui/material";

const ENGLISH_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CHEATSHEET_STATES = [
  undefined,
  "success.main",
  "error.main",
  "info.main",
];
export default function JottoGame() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;

  const playBellRef = useRef(false);

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  // Make game review start at the final state
  useEffect(() => {
    if (game.review) updateStateViewing({ type: "current" });
  }, []);

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

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;
    });

    socket.on("winners", (winners) => {});
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
          flex="0 0 auto"
        />
      )}
    </>
  );

  const isPhoneDevice = useIsPhoneDevice();

  const stateInfo =
    stateViewing >= 0
      ? history.states[stateViewing]
      : game.review && stateViewing === -2
        ? history.states[-2]
        : null;
  const extraInfo = stateInfo ? stateInfo.extraInfo : null;
  const turnOrder = extraInfo ? extraInfo.turnOrder : [];
  const meetings = stateInfo ? stateInfo.meetings : {};

  const guessMeeting = Object.values(meetings).find(
    (m) => m.name === "Guess Word" && m.voting
  );
  const selectWordMeeting = Object.values(meetings).find(
    (m) => m.name === "Select Word" && m.voting
  );

  const jottoMeetingNames = new Set(["Guess Word", "Select Word"]);
  const filteredMeetings = Object.fromEntries(
    Object.entries(meetings).filter(([, m]) => !jottoMeetingNames.has(m.name))
  );

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

  const filteredDescriptors = useMemo(() => {
    const result = buildActionDescriptors({
      meetings: filteredMeetings,
      baseActionProps,
    });
    return result.regularActionDescriptors;
  }, [filteredMeetings, baseActionProps]);

  return (
    <GameTypeContext.Provider
      value={{
        singleState: true,
      }}
    >
      <TopBar />
      {!isPhoneDevice && (
        <div className="jotto-desktop">
          <div className="jotto-main-row">
            <div className="jotto-sidebar panel with-radial-gradient">
              {jottoCheatSheet}
              <Notes />
              <SideMenu
                title="Actions"
                isAccordionMenu
                content={
                  <div className="action-list">
                    {(filteredDescriptors || []).map(
                      ({ Component, props, key }) => (
                        <Component key={key} {...props} />
                      )
                    )}
                  </div>
                }
              />
              <SettingsMenu />
            </div>

            <div className="jotto-center panel with-radial-gradient">
              {history.currentState == -1 ? (
                <div className="jotto-pregame">
                  <PlayerList />
                </div>
              ) : turnOrder.length > 0 ? (
                turnOrder.map((name) => (
                  <JottoHistoryPanel
                    key={name}
                    name={name}
                    guessHistory={extraInfo.guessHistoryByNames[name]}
                    guessMeeting={guessMeeting}
                    socket={game.socket}
                    self={game.self}
                    players={game.players}
                  />
                ))
              ) : (
                <div className="jotto-select-word">
                  <JottoGuessInput
                    meeting={selectWordMeeting}
                    socket={game.socket}
                    self={game.self}
                    isMyTurn={
                      selectWordMeeting &&
                      selectWordMeeting.amMember &&
                      selectWordMeeting.canVote
                    }
                    placeholder="Select word"
                    label={selectWordMeeting?.actionName || "Select Word"}
                    showChoiceFeedback
                  />
                </div>
              )}
            </div>

            <div className="jotto-sidebar panel with-radial-gradient">
              <TextMeetingLayout />
            </div>
          </div>
        </div>
      )}
      <MobileLayout
        outerLeftNavigationProps={{
          label: "Info",
          value: "players",
          icon: <i className="fas fa-info" />,
        }}
        outerLeftContent={
          <>
            <PlayerList />
            {jottoCheatSheet}
            <Notes />
          </>
        }
        innerRightNavigationProps={{
          label: "Game",
          value: "actions",
          icon: <i className="fas fa-gamepad" />,
        }}
        innerRightContent={
          <>
            {history.currentState !== -1 && (
              turnOrder.length > 0 ? (
                <div className="jotto-mobile-panels">
                  {turnOrder.map((name) => (
                    <JottoHistoryPanel
                      key={name}
                      name={name}
                      guessHistory={extraInfo.guessHistoryByNames[name]}
                      guessMeeting={guessMeeting}
                      socket={game.socket}
                      self={game.self}
                      players={game.players}
                    />
                  ))}
                </div>
              ) : (
                <div className="jotto-select-word">
                  <JottoGuessInput
                    meeting={selectWordMeeting}
                    socket={game.socket}
                    self={game.self}
                    isMyTurn={
                      selectWordMeeting &&
                      selectWordMeeting.amMember &&
                      selectWordMeeting.canVote
                    }
                    placeholder="Select word"
                    label={selectWordMeeting?.actionName || "Select Word"}
                    showChoiceFeedback
                  />
                </div>
              )
            )}
            <div className="action-list">
              {(filteredDescriptors || []).map(
                ({ Component, props, key }) => (
                  <Component key={key} {...props} />
                )
              )}
            </div>
          </>
        }
        chatTab
        hideInfoTab
      />
    </GameTypeContext.Provider>
  );
}

function JottoCheatSheet({ cheatSheet, updateCheatSheet }) {
  return (
    <Stack
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 3em)",
        p: 1,
        gap: 0.5,
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
          gridColumn: "span 5",
          justifySelf: "stretch",
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
  const review = props.review;

  if (stateViewing < 0 && !(review && stateViewing === -2)) return <></>;

  const state = history.states[stateViewing];
  if (!state) return <></>;
  const extraInfo = state.extraInfo;
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

function JottoHistoryPanel({
  name,
  guessHistory,
  guessMeeting,
  socket,
  self,
  players,
}) {
  const player = Object.values(players).find((p) => p.name === name);
  const isSelf = player && player.id === self;
  const isMyTurn =
    isSelf && guessMeeting && guessMeeting.amMember && guessMeeting.canVote;

  return (
    <div className="jotto-history-panel">
      <div className="jotto-panel-header">
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "center", p: 1, pt: 3 }}
        >
          {player && (
            <Avatar
              id={player.userId}
              name={player.name}
              hasImage={player.avatar}
              small
            />
          )}
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", fontFamily: "inherit" }}
          >
            {name}
          </Typography>
        </Stack>
        {isSelf && isMyTurn ? (
          <JottoGuessInput
            meeting={guessMeeting}
            socket={socket}
            self={self}
            isMyTurn={isMyTurn}
          />
        ) : (
          <div className="jotto-guess-input-spacer" />
        )}
      </div>
      <div className="jotto-panel-guesses">
        <JottoGuessHistoryByName guessHistory={guessHistory} />
      </div>
    </div>
  );
}

function JottoGuessInput({
  meeting,
  socket,
  self,
  isMyTurn,
  placeholder,
  label,
  showChoiceFeedback,
}) {
  const [textData, setTextData] = useState("");
  const [lastAccepted, setLastAccepted] = useState(
    () => meeting?.votes?.[self] || null
  );
  const [rejection, setRejection] = useState(null);
  const pendingSubmitRef = useRef(null);

  const textOptions = meeting ? meeting.textOptions || {} : {};
  const minLength = textOptions.minLength || 0;
  const maxLength = textOptions.maxLength || 50;
  const disabled = !isMyTurn || !meeting || meeting.finished;
  const currentVote = meeting?.votes?.[self];
  const voteRecordLen = meeting?.voteRecord?.length || 0;

  useEffect(() => {
    if (!showChoiceFeedback) return;

    const pending = pendingSubmitRef.current;

    if (!pending) {
      if (currentVote) setLastAccepted(currentVote);
      return;
    }

    if (currentVote === pending) {
      setLastAccepted(currentVote);
      setRejection(null);
      pendingSubmitRef.current = null;
    } else if (!currentVote) {
      setRejection(`"${pending}" is not a valid dictionary word.`);
      pendingSubmitRef.current = null;
    }
  }, [showChoiceFeedback, currentVote, voteRecordLen]);

  function handleOnChange(e) {
    let textInput = e.target.value;
    if (textOptions.alphaOnly) {
      textInput = textInput.replace(/[^a-z]/gi, "");
    }
    if (textOptions.toLowerCase) {
      textInput = textInput.toLowerCase();
    }
    textInput = textInput.substring(0, maxLength);
    setTextData(textInput);
  }

  function handleOnSubmit() {
    if (!meeting || textData.length < minLength || disabled) return;
    pendingSubmitRef.current = textData;
    if (showChoiceFeedback) {
      setRejection(null);
    } else {
      meeting.votes[self] = textData;
    }
    socket.send("vote", {
      meetingId: meeting.id,
      selection: textData,
    });
    setTextData("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleOnSubmit();
    }
  }

  return (
    <Stack
      spacing={0.5}
      sx={{
        px: 1,
        pb: 0.5,
        opacity: disabled ? 0.4 : 1,
        alignItems: "center",
        maxWidth: "280px",
        mx: "auto",
      }}
    >
      {label && (
        <Typography variant="subtitle2" sx={{ fontFamily: "inherit" }}>
          {label}
        </Typography>
      )}
      <Stack direction="row" spacing={0.5} sx={{ width: "100%", alignItems: "center" }}>
      <TextField
        value={textData}
        onChange={handleOnChange}
        onKeyDown={handleKeyDown}
        size="small"
        fullWidth
        disabled={disabled}
        placeholder={placeholder || "Guess word"}
        sx={{ "& .MuiInputBase-input": { py: "4px", px: 1, fontSize: "0.9em" } }}
      />
      <Button
        variant="contained"
        onClick={handleOnSubmit}
        disabled={disabled || textData.length < minLength}
        size="small"
        sx={{ minWidth: "auto", px: 1, py: "3px", fontSize: "0.75em" }}
      >
        {textOptions.submit || "Confirm"}
      </Button>
      </Stack>
      {showChoiceFeedback && lastAccepted && (
        <Typography
          variant="body2"
          sx={{
            color: "error.main",
            fontFamily: "inherit",
            fontWeight: "bold",
          }}
        >
          You chose: {lastAccepted.toUpperCase()}
        </Typography>
      )}
      {showChoiceFeedback && rejection && (
        <Typography
          variant="caption"
          sx={{ color: "error.main", fontFamily: "inherit" }}
        >
          {rejection}
        </Typography>
      )}
    </Stack>
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
  const guessHistory = props.guessHistory || [];

  return (
    <div className="jotto-guess-history">
      {guessHistory.map((g, i) => (
        <JottoGuess key={i} word={g.word} score={g.score} />
      ))}
    </div>
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
        {score === null ? (
          <div className={"jotto-guess-score forbidden"}>!</div>
        ) : (
          <div className={`jotto-guess-score guess-score-${score}`}>
            {score}
          </div>
        )}
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
