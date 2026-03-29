const Player = require("../../core/Player");
const deathMessages = require("./templates/death");

module.exports = class SecretDictatorPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.deathMessages = deathMessages;
  }

  getRevealType(deathType) {
    // Non-Dictator deaths never reveal role — return a key with no appearance entry
    if (this.role.name !== "Dictator") return "none";
    return super.getRevealType(deathType);
  }
};
