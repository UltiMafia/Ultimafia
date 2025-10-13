const Effect = require("../Effect");

module.exports = class Fog extends Effect {
  constructor(lifespan) {
    super("Fog");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }

  hear(message) {
    if (
      !message.isServer &&
      message.sender != this.player &&
      message.sender != this.player.getNeighbors()[0] &&
      message.sender != this.player.getNeighbors()[1]
    ) {
      message.fiddled = true;
    }
  }

  seeTyping(info) {
    if (
      info.playerId != this.player.id &&
      info.playerId != this.player.getNeighbors()[0].id &&
      info.playerId != this.player.getNeighbors()[1].id
    )
      info.cancel = true;
  }
};
