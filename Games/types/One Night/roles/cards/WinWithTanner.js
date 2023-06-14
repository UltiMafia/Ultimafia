const Card = require("../../Card");

module.exports = class WinWithMinions extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 10,
      check(winners, dead, werewolfPresent) {
        if (!this.player.alive) {
          winners.addPlayer(this.player, "Tanner");
          winners.removeGroup("Werewolf");
        }
      },
    };
  }
};
