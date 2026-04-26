import React, { useRef, useEffect, useContext, useState } from "react";

import {
  useSocketListeners,
  ThreePanelLayout,
  TopBar,
  TextMeetingLayout,
  ActionList,
  PlayerList,
  Timer,
  SettingsMenu,
  MobileLayout,
  GameTypeContext,
} from "./Game";
import { GameContext } from "../../Contexts";
import { Avatar } from "../User/User";
import { SideMenu } from "./Game";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

import "css/game.css";
import "css/gameConnectFour.css";

export default function ConnectFourGame(props) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

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

  // Make player view current state when it changes
  useEffect(() => {
    updateStateViewing({ type: "current" });
  }, [history.currentState]);

  useEffect(() => {
    // Make game review start at postgame to show final board
    if (game.review) updateStateViewing({ type: "current" });
  }, []);

  useSocketListeners((socket) => {
    socket.on("state", (state) => {
      if (playBellRef.current) game.playAudio("ping");

      playBellRef.current = true;
    });

    socket.on("winners", (winners) => {});
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
            {history.currentState < 0 && <PlayerList />}
            <ActionList />
            <SettingsMenu />
          </>
        }
        centerPanelContent={
          <>
            <ConnectFourBoardWrapper />
          </>
        }
        rightPanelContent={
          <>
            <TextMeetingLayout />
          </>
        }
      />
      <MobileLayout
        chatTab
        hideInfoTab
        outerLeftNavigationProps={{
          label: "Info",
          value: "players",
          icon: <i className="fas fa-info" />,
        }}
        outerLeftContent={
          <>
            <PlayerList />
            <ActionList />
          </>
        }
        innerRightContent={<ConnectFourBoardWrapper />}
        innerRightNavigationProps={{
          label: "Board",
          value: "actions",
          icon: <i className="fas fa-th" />,
        }}
      />
    </GameTypeContext.Provider>
  );
}

function ConnectFourBoardWrapper() {
  const game = useContext(GameContext);

  const players = game.players;
  const history = game.history;
  const stateViewing = game.stateViewing;

  if (stateViewing === -1) return <TextMeetingLayout />;

  const currentState = history.states[stateViewing];
  if (!currentState?.extraInfo?.board) return <TextMeetingLayout />;
  const meetings = currentState ? currentState.meetings : {};
  const isCurrentState = stateViewing === history.currentState;

  // Find the "Choose Column" meeting for click-to-drop
  let columnMeeting = null;
  if (isCurrentState) {
    columnMeeting = Object.values(meetings).find(
      (m) => m.voting && m.amMember && m.canVote
    );
  }

  function onColumnClick(colIndex) {
    if (!columnMeeting) return;

    const selection = String(colIndex + 1);
    const isUnvote = columnMeeting.votes[game.self] === selection;

    if (!isUnvote) {
      game.socket.send("vote", {
        meetingId: columnMeeting.id,
        selection,
      });
    } else {
      game.socket.send("unvote", {
        meetingId: columnMeeting.id,
        selection,
      });
    }
  }

  return (
    <SideMenu
      title="Board"
      scrollable
      content={
        <>
          <ConnectFourBoard
            history={history}
            stateViewing={stateViewing}
            players={players}
            onColumnClick={columnMeeting ? onColumnClick : null}
            winningLine={currentState?.extraInfo?.winningLine}
          />
        </>
      }
    />
  );
}

function ConnectFourBoard(props) {
  const extraInfo = props.history.states[props.stateViewing].extraInfo;
  const rows = extraInfo.board;
  const [hoveredCol, setHoveredCol] = useState(null);

  const winningCells = new Set();
  if (props.winningLine) {
    for (const [r, c] of props.winningLine) {
      winningCells.add(`${r},${c}`);
    }
  }

  return (
    <>
      <div
        className="connectFour-board"
        onMouseLeave={() => setHoveredCol(null)}
      >
        {rows.map((row, rowIndex) => (
          <BoardRow
            key={rowIndex}
            rowIndex={rowIndex}
            columns={row}
            players={props.players}
            onColumnClick={props.onColumnClick}
            hoveredCol={props.onColumnClick ? hoveredCol : null}
            setHoveredCol={props.onColumnClick ? setHoveredCol : undefined}
            winningCells={winningCells}
          />
        ))}
      </div>
    </>
  );
}

function BoardRow(props) {
  const columns = props.columns;

  return (
    <div className="connectFour-board-row">
      {columns.map((column, colIndex) => (
        <BoardBox
          key={colIndex}
          column={column}
          players={props.players}
          onClick={
            props.onColumnClick
              ? () => props.onColumnClick(colIndex)
              : undefined
          }
          clickable={!!props.onColumnClick}
          highlighted={props.hoveredCol === colIndex}
          isWinning={props.winningCells.has(`${props.rowIndex},${colIndex}`)}
          onMouseEnter={
            props.setHoveredCol
              ? () => props.setHoveredCol(colIndex)
              : undefined
          }
        />
      ))}
    </div>
  );
}

function BoardBox(props) {
  const column = props.column;
  const clickable = props.clickable;

  const classNames = ["connectFour-board-box"];
  if (clickable) classNames.push("clickable");
  if (props.highlighted) classNames.push("highlighted");
  if (props.isWinning) classNames.push("winning");
  const className = classNames.join(" ");

  if (column == " " || !props.players) {
    return (
      <div className={className} onClick={props.onClick} onMouseEnter={props.onMouseEnter}>
        {column}
      </div>
    );
  } else {
    let temp;
    let playersInGame = Object.values(props.players);
    for (let i = 0; i < playersInGame.length; i++) {
      if (playersInGame[i].name == column) {
        temp = playersInGame[i];
      }
    }
    return (
      <div className={className} onClick={props.onClick} onMouseEnter={props.onMouseEnter}>
        {<PlayerAvatar player={temp} />}
      </div>
    );
  }
}

function PlayerAvatar(props) {
  const player = props.player;
  let avatarId = player.userId;
  if (player.anonId != null && player.anonId != undefined) {
    avatarId = player.anonId;
  }

  return (
    <>
      <Avatar
        id={player.userId}
        avatarId={avatarId}
        hasImage={player.avatar}
        name={player.name}
        mediumlarge
        ConnectFour
      />
    </>
  );
}
