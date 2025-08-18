const Player = require("../../core/Player");

module.exports = class ConnectFourPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }
};
