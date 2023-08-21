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

        const hitlerDead = !this.game.players.filter(p => p.role.name == "Hitler")[0].alive
        if (hitlerDead && !this.game.announcedWin) {
          this.game.announcedWin = true;
          this.game.queueAlert("Hitler has been assasinated!");
        }

        if (enactedEnough || hitlerDead) {
          winners.addPlayer(this.player, "Liberals");
        }
      },
    };
  }
};
