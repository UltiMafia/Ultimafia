const Player = require("../../core/Player");

module.exports = class AcrotopiaPlayer extends Player {
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
  
  // to hide the alert
  setRole(roleName) {
    super.setRole(roleName, undefined, false, true)
  }
};
