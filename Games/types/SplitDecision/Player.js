const Player = require("../../core/Player");

module.exports = class SplitDecisionPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.room = 1;
  }

  putInRoom(room) {
    this.room = room;
    this.dropItem("Room", true);
    this.holdItem("Room", room);
  }
};
