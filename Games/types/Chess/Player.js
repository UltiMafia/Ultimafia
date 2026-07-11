const Player = require("../../core/Player");

module.exports = class ChessPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }
};
