const Winners = require("../../core/Winners");

module.exports = class RatscrewWinners extends Winners {
  constructor(game) {
    super(game);
  }

  // Ratscrew has a single role, so the engine's default
  //   "Player wins! (CiapasHeisser38)"
  // is redundant. Use just the winner's name(s):
  //   "CiapasHeisser38 wins!"
  queueAlerts() {
    for (let group in this.groups) {
      const players = [...new Set(this.groups[group])];
      if (players.length === 0) {
        this.game.queueAlert(`${group} wins!`);
        continue;
      }
      const names = players.map((p) => p.name).join(", ");
      const plural = players.length > 1;
      this.game.queueAlert(`${names} win${plural ? "" : "s"}!`);
    }
  }
};
