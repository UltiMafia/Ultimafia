import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  OptionsList,
  Timer,
  Notes,
  SettingsMenu,
  MobileLayout,
  SpeechFilter,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/game.css";
import "css/gameLiarsDice.css";
import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";

export default function LiarsDiceGame(props) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;
  const gameOptions = game.options.gameTypeOptions;

  const playBellRef = useRef(false);

  const gameType = "Liars Dice";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  const audioFileNames = ["diceRoll", "diceRoll2", "gunshot"];
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
    socket.on("diceRoll", () => {
      game.playAudio("diceRoll");
    });
    socket.on("diceRoll2", () => {
      game.playAudio("diceRoll2");
    });
    socket.on("gunshot", () => {
      game.playAudio("gunshot");
    });
  }, game.socket);

  const playerList = (
    <>
      {stateViewing < 0 && <PlayerList />}
      <LiarsDiceDiceViewWrapper
        history={history}
        stateViewing={stateViewing}
        self={self}
      />
    </>
  );

  const actionList = (
    <ActionList
      title="Make A Bid!"
      style={{
        color: history.states?.[stateViewing]?.extraInfo?.isTheFlyingDutchman
          ? "#718E77"
          : undefined,
      }}
    />
  );

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
            {playerList}
            <SettingsMenu />
          </>
        }
        centerPanelContent={<TextMeetingLayout />}
        rightPanelContent={
          <>
            <LiarsDiceCurrentGuess />
            <OptionsList />
            {actionList}
            <Notes />
          </>
        }
      />
      <MobileLayout
        outerLeftContent={playerList}
        innerRightContent={
          <>
            <LiarsDiceCurrentGuess />
            <OptionsList />
            {actionList}
          </>
        }
        additionalInfoContent={
          <>
            <Notes />
          </>
        }
      />
    </GameTypeContext.Provider>
  );
}

function LiarsDiceCurrentGuess() {
  const game = useContext(GameContext);
  const { history, stateViewing } = game;

  if (stateViewing < 0) return <></>;

  const currentState = history.states[stateViewing];

  const { allDice, lastAmountBid, lastFaceBid, lastBidder, currentBidder } =
    currentState.extraInfo.bidInfo;

  const bidPercent = (Math.min(lastAmountBid, allDice) / allDice) * 100;
  const die = <div className={`dice dice-${lastFaceBid}`} />;

  let content = null;
  if (lastBidder) {
    content = (
      <>
        <Stack
          direction="row"
          sx={{
            position: "relative",
            alignItems: "center",
          }}
        >
          <CircularProgress
            variant="determinate"
            size="2em"
            thickness={4}
            enableTrackSlot
            value={bidPercent}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h3">{lastAmountBid}</Typography>
          </Box>
        </Stack>
        {die}
        <Typography sx={{ marginLeft: "auto !important" }}>
          {lastBidder}'s bet
        </Typography>
      </>
    );
  } else {
    content = (
      <Typography sx={{ marginLeft: "auto !important" }}>
        Initial bet
      </Typography>
    );
  }

  return (
    <SideMenu
      title={`${currentBidder}'s turn`}
      content={
        <Stack
          direction="row"
          spacing={1}
          sx={{
            p: 1,
            alignItems: "center",
            minHeight: "calc(2*var(--mui-spacing) + 2em)",
          }}
        >
          {content}
        </Stack>
      }
    />
  );
}

function LiarsDiceDiceViewWrapper(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;
  const self = props.self;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="Dice"
      scrollable
      className="liars-dice-wrapper"
      content={
        <div className="liars-dice-players-container">
          {extraInfo.randomizedPlayers.map((player, index) => (
            <LiarsDicePlayerRow
              key={index}
              userId={player.userId}
              playerName={player.playerName}
              diceValues={player.rolledDice}
              previousRolls={player.previousRolls}
              isCurrentPlayer={player.playerId === self}
              isTheFlyingDutchman={extraInfo.isTheFlyingDutchman}
              whoseTurnIsIt={extraInfo.whoseTurnIsIt}
            />
          ))}
        </div>
      }
    />
  );
}

function LiarsDicePlayerRow({
  userId,
  playerName,
  diceValues,
  previousRolls,
  isCurrentPlayer,
  isTheFlyingDutchman,
  whoseTurnIsIt,
}) {
  previousRolls = previousRolls || [];
  const isSamePlayer = whoseTurnIsIt === userId;
  return (
    <div className="liars-dice-player-section">
      <div
        className={`liars-dice-player-name ${
          isCurrentPlayer ? "current-player" : ""
        }`}
        style={
          isTheFlyingDutchman
            ? {
                backgroundColor: isCurrentPlayer ? "#506D56" : "#48654e",
                borderColor: "#3B5841",
                cursor: "pointer",
              }
            : {
                cursor: "pointer",
              }
        }
        onClick={() => window.open(`/user/${userId}`, "_blank")}
      >
        {playerName}
      </div>
      <div
        className="liars-dice-dice-container"
        style={
          isTheFlyingDutchman
            ? {
                borderColor: isSamePlayer ? "grey" : "#3B5841",
              }
            : {
                borderColor: isSamePlayer ? "grey" : undefined,
              }
        }
      >
        <div className="current-rolls">
          {diceValues.map((value, index) => (
            <div
              key={index}
              className={`dice ${
                isCurrentPlayer ? `dice-${value}` : "dice-unknown"
              }`}
            ></div>
          ))}
        </div>
        {previousRolls.length > 0 && (
          <>
            <div className="previous-rolls">
              <div
                className="previous-rolls-label"
                style={
                  isTheFlyingDutchman
                    ? {
                        color: "#3B5841",
                      }
                    : {}
                }
              >
                Last round:
              </div>
              <div className="previous-rolls-dice">
                {previousRolls.map((value, index) => (
                  <div
                    key={index}
                    className={`dice previous-rolls dice-${value}`}
                  ></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
