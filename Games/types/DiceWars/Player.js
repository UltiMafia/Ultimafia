const Player = require("../../core/Player");

module.exports = class DiceWarsPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    // All actions are now handled through the card/meeting system
    // No socket-based attack handlers needed
  }
};
