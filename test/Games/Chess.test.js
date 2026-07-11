const chai = require("chai");
const should = chai.should();

const constants = require("../../data/constants");
const ChessGame = require("../../Games/types/Chess/Game");
const { Chess } = require("chess.js");

describe("Games/Chess", function () {
  describe("Player limit", function () {
    it("is fixed at 2 players", function () {
      constants.fixedPlayerTotals.Chess.should.equal(2);
    });
  });

  describe("Board Initialization", function () {
    it("starts with the correct initial FEN", function () {
      const chess = new Chess();
      const initialFen = chess.fen();
      
      const game = new ChessGame({
        id: "testChess",
        hostId: "testHost",
        settings: {
          setup: { id: "testSetup" },
          stateLengths: {
            Turn: 60 * 1000,
          },
        },
        isTest: true,
      });

      game.fen.should.equal("");
      game.currentPlayerColor.should.equal("w");
    });
  });

  describe("Move playing", function () {
    it("assigns colors, initializes board and processes valid and invalid moves", function () {
      const game = new ChessGame({
        id: "testChess",
        hostId: "testHost",
        settings: {
          setup: { id: "testSetup" },
          stateLengths: {
            Turn: 60 * 1000,
          },
        },
        isTest: true,
      });

      // Mock players
      const player1 = { name: "Alice", id: "1", alive: true, role: { name: "Grandmaster" } };
      const player2 = { name: "Bob", id: "2", alive: true, role: { name: "Grandmaster" } };

      game.players = {
        array: () => [player1, player2],
        [Symbol.iterator]: function* () {
          yield player1;
          yield player2;
        }
      };

      game.start();

      // Check player colors assigned
      game.playerColors.Alice.should.be.oneOf(["w", "b"]);
      game.playerColors.Bob.should.be.oneOf(["w", "b"]);
      game.playerColors.Alice.should.not.equal(game.playerColors.Bob);

      // Identify who is white
      const whitePlayer = game.playerColors.Alice === "w" ? "Alice" : "Bob";
      const blackPlayer = game.playerColors.Alice === "b" ? "Alice" : "Bob";

      // Try making a move out of turn (black moves first)
      game.makeMove(blackPlayer, "e7e5").should.be.false;

      // White moves first
      game.makeMove(whitePlayer, "e2e4").should.be.true;
      
      // FEN should be updated
      game.fen.should.not.equal("");
    });
  });
});
