const Player = require("../../core/Player");

module.exports = class AcrotopiaPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.score = 0;
  }
};
