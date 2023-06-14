const Player = require("../../core/Player");

module.exports = class GhostPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }

  getHistory(targetState) {
    const history = super.getHistory(targetState);
    for (const i in history) {
      if (i < 0) {
        return history;
      }

      history[i].extraInfo.word = this.role?.word;
      history[i].extraInfo.wordLength = this.game.wordLength;
    }

    return history;
  }

  // add player-specific state info
  sendStateInfo() {
    const info = this.game.getStateInfo();
    info.extraInfo.word = this.role?.word;
    info.extraInfo.wordLength = this.game.wordLength;
    this.send("state", info);
  }
};
