import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  BotBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  Notes,
  SettingsMenu,
} from "./Game";
import { GameContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { SideMenu } from "./Game";

import "css/game.css";
import "css/gameConnectFour.css";

export default function ConnectFourGame(props) {
  const game = useContext(GameContext);

  const history = game.history;
  const updateHistory = game.updateHistory;
  const stateViewing = game.stateViewing;
  const updateStateViewing = game.updateStateViewing;
  const self = game.self;
  const players = game.players;
  const isSpectator = game.isSpectator;

  const playBellRef = useRef(false);

  const gameType = "Connect Four";
  const meetings = history.states[stateViewing]
    ? history.states[stateViewing].meetings
    : {};
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
    });
  }, game.socket);

  return (
    <>
      <BotBar
        gameType={gameType}
        game={game}
        history={history}
        stateViewing={stateViewing}
        updateStateViewing={updateStateViewing}
        players={players}
        gameName={
          <div className="game-name">
            <span>Connect Four</span>
          </div>
        }
        hideStateSwitcher
      />
      <ThreePanelLayout
        leftPanelContent={
          <>
            {history.currentState == -1 && (
              <PlayerList
                players={players}
                history={history}
                gameType={gameType}
                stateViewing={stateViewing}
                activity={game.activity}
              />
            )}
            <ActionList
              socket={game.socket}
              meetings={meetings}
              players={players}
              self={self}
              history={history}
              stateViewing={stateViewing}
            />
            <SettingsMenu
              settings={game.settings}
              updateSettings={game.updateSettings}
              showMenu={game.showMenu}
              setShowMenu={game.setShowMenu}
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
              setup={game.setup}
              localAudioTrack={game.localAudioTrack}
            />
          </>
        }
        rightPanelContent={
          <>
            <ConnectFourBoardWrapper stateViewing={stateViewing} history={history} />
            {!isSpectator && <Notes stateViewing={stateViewing} />}
          </>
        }
      />
    </>
  );
}

function ConnectFourBoardWrapper(props) {
  const stateViewing = props.stateViewing;

  if (stateViewing < 0) return <></>;

  return (
    <SideMenu
      title="Board"
      scrollable
      content={
        <>
          <ConnectFourBoard history={props.history} stateViewing={stateViewing} />
        </>
      }
    />
  );
}

function ConnectFourBoard(props) {
  const extraInfo = props.history.states[props.stateViewing].extraInfo;
  const rows = extraInfo.board;

  return (
    <>
      <div className="connectFour-board">
        {rows.map((row) => {
          return <BoardRow columns={row} />;
        })}
      </div>
    </>
  );
}

function BoardRow(props) {
  const columns = props.values;

  let rowData = [];
  for (let column of columns) {
    rowData.push(<BoardBox column={column} />);
  }

  return (
    <>
      <div className="connectFour-board-row">{rowData}</div>
    </>
  );
}

function BoardBox(props) {
  const column = props.column;

  return (
    <>
      <div className="connectFour-board-box">{column}</div>
    </>
  );
}

function PlayerAvatar(props) {
  const player = props.player;

  let avatarId = player.anonId === undefined ? player.userId : player.anonId;

  return (
    <>
      <Avatar
        id={player.userId}
        avatarId={avatarId}
        name={player.name}
        large
      />
    </>
  );
}