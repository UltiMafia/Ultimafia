const Card = require("../../Card");

module.exports = class WinWithLiberals extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        let enactedEnough = this.game.numLiberalPolicyEnacted == 5;
        if (enactedEnough && !this.game.announcedWin) {
          this.game.announcedWin = true;
          this.game.queueAlert("The liberals have enacted five policies!");
        }

        if (this.game.dictatorAssassinated && !this.game.announcedWin) {
          this.game.announcedWin = true;
          this.game.queueAlert("Dictator has been assasinated!");
        }

        if (enactedEnough || this.game.dictatorAssassinated) {
          winners.addPlayer(this.player, "Liberals");
        }
      },
    };
  }
};
