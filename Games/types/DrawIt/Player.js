const CorePlayer = require("../../core/Player");

module.exports = class Player extends CorePlayer {
  constructor(user, game, isBot) {
    super(user, game, isBot);
    this.score = 0;
  }

  addScore(score) {
    this.score += score;
  }

  getScore() {
    return this.score;
  }

  setRole(roleName) {
    super.setRole(roleName, undefined, false, true);
  }
};
