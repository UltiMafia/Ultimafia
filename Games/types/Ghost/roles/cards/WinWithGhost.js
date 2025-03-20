const Card = require("../../Card");

module.exports = class WinWithGhost extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        let wordHasBeenGuessed = false;
        for (let player of this.game.players) {
          if (player.role.alignment == "Ghost" && player.role.guessedWord == this.game.townWord) {
            wordHasBeenGuessed = true;
            break;
          }
        }
        if (
          (aliveCount > 0 && counts["Ghost"] >= counts["Town"]) ||
          wordHasBeenGuessed == true
        ) {
          winners.addPlayer(this.player, "Ghost");
        }
      },
    };
  }
};
