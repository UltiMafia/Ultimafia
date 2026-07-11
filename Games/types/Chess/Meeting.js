const Meeting = require("../../core/Meeting");
const { Chess } = require("chess.js");

module.exports = class ChessMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }

  vote(voter, selection) {
    if (this.name === "Make Move") {
      const chess = new Chess(this.game.fen);
      try {
        // Validate player color matches current turn
        const playerColor = this.game.playerColors[voter.name];
        if (playerColor !== this.game.currentPlayerColor) {
          voter.sendAlert("It is not your turn!");
          return false;
        }

        // Validate the move using chess.js
        // Try parsing the selection (could be UCI or SAN)
        const move = chess.move(selection);
        if (!move) {
          voter.sendAlert("Invalid chess move!");
          return false;
        }
      } catch (e) {
        voter.sendAlert("Invalid chess move: " + e.message);
        return false;
      }
    }
    return super.vote(voter, selection);
  }
};
