import React, { useRef, useEffect, useContext, useState } from "react";
import { Chess } from "chess.js";

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
import "css/gameChess.css";

export default function ChessGame(props) {
  const game = useContext(GameContext);
  const isPhoneDevice = useIsPhoneDevice();

  const history = game.history;
  const updateStateViewing = game.updateStateViewing;
  const stateViewing = game.stateViewing;

  const playBellRef = useRef(false);

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
            <ChessBoardWrapper />
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
        innerRightContent={<ChessBoardWrapper />}
        innerRightNavigationProps={{
          label: "Board",
          value: "actions",
          icon: <i className="fas fa-chess-board" />,
        }}
      />
    </GameTypeContext.Provider>
  );
}

function ChessBoardWrapper() {
  const game = useContext(GameContext);
  const history = game.history;
  const stateViewing = game.stateViewing;

  if (stateViewing === -1) {
    return (
      <SideMenu
        title="Chess Board"
        scrollable
        content={
          <div className="chess-container">
            <ChessBoardPanel
              extraInfo={{
                fen: "",
                turn: "w",
                playerColors: {},
                history: [],
                gameOverReason: null,
                winnerColor: null,
              }}
              self={game.self}
              onMakeMove={null}
            />
          </div>
        }
      />
    );
  }

  const currentState = history.states[stateViewing];
  if (!currentState?.extraInfo) {
    return (
      <SideMenu
        title="Chess Board"
        scrollable
        content={
          <div className="chess-container">
            <ChessBoardPanel
              extraInfo={{
                fen: "",
                turn: "w",
                playerColors: {},
                history: [],
                gameOverReason: null,
                winnerColor: null,
              }}
              self={game.self}
              onMakeMove={null}
            />
          </div>
        }
      />
    );
  }
  
  const extraInfo = currentState.extraInfo;
  const isCurrentState = stateViewing === history.currentState;
  const meetings = currentState ? currentState.meetings : {};

  // Find the "Make Move" meeting
  let moveMeeting = null;
  if (isCurrentState) {
    moveMeeting = Object.values(meetings).find(
      (m) => m.voting && m.amMember && m.canVote
    );
  }

  function onMakeMove(moveStr) {
    if (!moveMeeting) return;
    game.socket.send("vote", {
      meetingId: moveMeeting.id,
      selection: moveStr,
    });
  }

  return (
    <SideMenu
      title="Chess Board"
      scrollable
      content={
        <div className="chess-container">
          <ChessBoardPanel
            extraInfo={extraInfo}
            self={game.self}
            onMakeMove={moveMeeting ? onMakeMove : null}
          />
        </div>
      }
    />
  );
}

function ChessBoardPanel({ extraInfo, self, onMakeMove }) {
  const game = useContext(GameContext);
  const players = game.players;
  const { fen, turn, playerColors, history: moveHistory, gameOverReason, winnerColor } = extraInfo;
  
  const playerName = players?.[self]?.name || "";
  const playerColor = playerColors[playerName] || "w"; // Default to white if spectator

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  
  const chess = useRef(null);

  // Initialize or update local chess state
  useEffect(() => {
    if (fen) {
      chess.current = new Chess(fen);
    } else {
      chess.current = new Chess();
    }
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [fen]);

  if (!chess.current) return null;

  const board = chess.current.board();
  const isTurn = onMakeMove && playerColor === turn;

  // Map of pieces to Unicode symbols
  const pieceSymbols = {
    w: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
    b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
  };

  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  // Flip board if player is black
  const boardRanks = playerColor === "b" ? [...ranks].reverse() : ranks;
  const boardFiles = playerColor === "b" ? [...files].reverse() : files;

  const inCheck = chess.current.inCheck();
  const kingSquare = inCheck
    ? board.flat().find((p) => p && p.type === "k" && p.color === turn)?.square
    : null;

  function handleSquareClick(square) {
    if (!isTurn) return;

    const piece = chess.current.get(square);

    // If a possible move square was clicked, execute move
    if (possibleMoves.includes(square)) {
      // Check if it's a promotion move (moving pawn to 8th/1st rank)
      const selectedPiece = chess.current.get(selectedSquare);
      const isPawn = selectedPiece && selectedPiece.type === "p";
      const targetRank = square[1];
      const isPromotion = isPawn && (targetRank === "8" || targetRank === "1");
      
      const moveStr = isPromotion 
        ? `${selectedSquare}${square}q` // Auto-promote to Queen
        : `${selectedSquare}${square}`;

      if (onMakeMove) {
        onMakeMove(moveStr);
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // Select piece of player's own color
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      // Get valid moves for this piece
      const moves = chess.current.moves({ square: square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }

  // Get active turn indicator
  const whitePlayerName = Object.keys(playerColors).find(name => playerColors[name] === "w") || "White";
  const blackPlayerName = Object.keys(playerColors).find(name => playerColors[name] === "b") || "Black";
  
  return (
    <div className="chess-panel">
      {/* Game info header */}
      <div className="chess-header">
        <div className="chess-players-status">
          <div className={`chess-player-indicator white-indicator ${turn === "w" ? "active" : ""}`}>
            <span className="dot"></span>
            <span className="name">{whitePlayerName} (White)</span>
          </div>
          <div className={`chess-player-indicator black-indicator ${turn === "b" ? "active" : ""}`}>
            <span className="dot"></span>
            <span className="name">{blackPlayerName} (Black)</span>
          </div>
        </div>
      </div>

      {/* Chessboard grid */}
      <div className="chess-board">
        {boardRanks.map((rank, rIdx) => (
          <div key={rank} className="chess-board-row">
            {boardFiles.map((file, fIdx) => {
              const squareName = `${file}${rank}`;
              const isDark = (rIdx + fIdx) % 2 === 1;
              
              // Get piece from local board representation
              // Ranks correspond to rows 0-7 (rank 8 is row 0, rank 1 is row 7)
              // Files correspond to columns 0-7 (file a is col 0, file h is col 7)
              const originalRIdx = ranks.indexOf(rank);
              const originalFIdx = files.indexOf(file);
              const piece = board[originalRIdx][originalFIdx];

              const isSelected = selectedSquare === squareName;
              const isPossible = possibleMoves.includes(squareName);
              const isKingInCheck = kingSquare === squareName;

              let squareClass = `chess-square ${isDark ? "dark-sq" : "light-sq"}`;
              if (isSelected) squareClass += " selected-sq";
              if (isPossible) squareClass += " possible-sq";
              if (isKingInCheck) squareClass += " check-sq";
              if (isTurn && piece && piece.color === playerColor) squareClass += " own-piece-sq";

              return (
                <div
                  key={squareName}
                  className={squareClass}
                  onClick={() => handleSquareClick(squareName)}
                >
                  {piece && (
                    <span className={`chess-piece ${piece.color}-piece`}>
                      {pieceSymbols[piece.color][piece.type]}
                    </span>
                  )}
                  {isPossible && !piece && <span className="possible-dot"></span>}
                  {/* Rank/File coordinates */}
                  {fIdx === 0 && (
                    <span className="coord coord-rank">{rank}</span>
                  )}
                  {rIdx === 7 && (
                    <span className="coord coord-file">{file}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Game status overlay */}
      {gameOverReason && (
        <div className="chess-game-over-overlay">
          <div className="overlay-box">
            <h3>Game Over</h3>
            <p className="reason">{gameOverReason}</p>
            <p className="result">
              {winnerColor === "draw" 
                ? "The game ended in a Draw!" 
                : `${winnerColor === "w" ? whitePlayerName : blackPlayerName} wins!`}
            </p>
          </div>
        </div>
      )}

      {/* History and moves log */}
      {moveHistory && moveHistory.length > 0 && (
        <div className="chess-history-log">
          <h4>Move History</h4>
          <div className="moves-grid">
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => (
              <div key={idx} className="move-pair">
                <span className="move-num">{idx + 1}.</span>
                <span className="move-white">{moveHistory[idx * 2]}</span>
                <span className="move-black">{moveHistory[idx * 2 + 1] || ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
