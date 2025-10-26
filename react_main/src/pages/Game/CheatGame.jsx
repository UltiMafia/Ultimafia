import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  ActionList,
  OptionsList,
  PlayerList,
  SettingsMenu,
  TextMeetingLayout,
  Notes,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/game.css";
import "css/gameCardGames.css";

export default function CheatGame(props) {
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

  const gameType = "Cheat";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
  const audioFileNames = [
    "cardShuffle",
    "gunshot",
    "chips_large1",
    "chips_large2",
    "chips_small1",
    "chips_small2",
  ];
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
    socket.on("cardShuffle", () => {
      game.playAudio("cardShuffle");
    });
    socket.on("chips_large1", () => {
      game.playAudio("chips_large1");
    });
    socket.on("chips_large2", () => {
      game.playAudio("chips_large");
    });
    socket.on("chips_small1", () => {
      game.playAudio("chips_small1");
    });
    socket.on("chips_small2", () => {
      game.playAudio("chips_small2");
    });
  }, game.socket);

  const playerList = (
    <>
      {stateViewing < 0 && <PlayerList />}
      <LiarscardcardViewWrapper
        history={history}
        stateViewing={stateViewing}
        self={self}
      />
    </>
  );

  const actionsList = (
    <ActionList
      title="Play your Cards!"
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
      <TopBar />
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
            <OptionsList />
            <ThePot />
            {actionsList}
            <Notes />
          </>
        }
      />
      <MobileLayout
        outerLeftContent={playerList}
        innerRightContent={
          <>
            <OptionsList />
            <ThePot />
            {actionsList}
          </>
        }
      />
    </GameTypeContext.Provider>
  );
}

export function ThePot() {
  const game = useContext(GameContext);

  const history = game.history;
  const stateViewing = game.stateViewing;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="Round Info"
      scrollable
      content={
        <table className="options-table">
          <tbody>
            Round:
            {extraInfo.RoundNumber}
          </tbody>
          <tbody>
            Current Card Rank:
            {extraInfo.RankNumber != 1 &&
            extraInfo.RankNumber != 11 &&
            extraInfo.RankNumber != 12 &&
            extraInfo.RankNumber != 13
              ? extraInfo.RankNumber
              : extraInfo.RankNumber == 1
              ? "Ace"
              : extraInfo.RankNumber == 11
              ? "Jack"
              : extraInfo.RankNumber == 12
              ? "Queen"
              : "King"}
          </tbody>
          <tbody>
            The Stack:
            {extraInfo.TheStack.length}
          </tbody>
        </table>
      }
    />
  );
}

function LiarscardcardViewWrapper(props) {
  const history = props.history;
  const stateViewing = props.stateViewing;
  const self = props.self;

  if (stateViewing < 0) return <></>;

  const extraInfo = history.states[stateViewing].extraInfo;

  return (
    <SideMenu
      title="Hand"
      scrollable
      className="card-games-wrapper"
      content={
        <div className="card-games-players-container">
          {extraInfo.randomizedPlayers.map((player, index) => (
            <LiarscardPlayerRow
              key={index}
              userId={player.userId}
              playerName={player.playerName}
              CardsInHand={player.CardsInHand}
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

function LiarscardPlayerRow({
  userId,
  playerName,
  CardsInHand,
  isCurrentPlayer,
  isTheFlyingDutchman,
  whoseTurnIsIt,
}) {
  const isSamePlayer = whoseTurnIsIt === userId;
  return (
    <div className="card-games-player-section">
      <div
        className={`card-games-player-name ${
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
        className="card-games-card-container"
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
          {CardsInHand.map((value, index) => (
            <div
              key={index}
              className={`card ${
                isCurrentPlayer ? `c${value}` : "card-unknown"
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
