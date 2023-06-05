const Player = require("../../core/Player");

module.exports = class GhostPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }

  // add player-specific state info
  sendStateInfo() {
    let info = this.game.getStateInfo();
    info.extraInfo.word = this.role?.word;
    info.extraInfo.wordLength = this.game.wordLength;
    this.send("state", info);
  }
};
