const Player = require("../../core/Player");

module.exports = class BattlesnakesPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.socket.on("move", (direction) => {
      this.game.setDirection(user.player.id, direction);
    });
  }
};
