const Player = require("../../core/Player");
const deathMessages = require("./templates/death");

module.exports = class SecretDictatorPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.deathMessages = deathMessages;
  }
};
