const Player = require("../../core/Player");
const deathMessages = require("./templates/death");

module.exports = class OneNightPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.deathMessages = deathMessages;
  }
};
