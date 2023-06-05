const Effect = require("../Effect");

module.exports = class Fiddled extends Effect {
  constructor(lifespan) {
    super("Fiddled");
    this.lifespan = lifespan || Infinity;
  }

  hear(message) {
    if (!message.isServer && message.sender != this.player) {
      message.cancel = true;
    }
  }

  seeTyping(info) {
    if (info.playerId != this.player.id) info.cancel = true;
  }
};
