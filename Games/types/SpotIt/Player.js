const Player = require("../../core/Player");

module.exports = class SpotItPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
    this.card = [];
  }
};
