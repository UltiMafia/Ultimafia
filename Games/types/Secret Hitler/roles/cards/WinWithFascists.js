const Card = require("../../Card");

module.exports = class WinWithFascists extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        // hitler does not know other fascists with 7-10 players
        if (this.game.players.length > 6 && this.role == "Hitler") {
          return;
        }

        for (let player of this.game.players) {
          if (player.role.alignment == "Fascists" && player != this.player) {
            this.revealToPlayer(player);
          }
        }
      },
    };

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        let enactedEnough = this.game.numFascistPolicyEnacted == 6;
        if (enactedEnough) {
          this.game.queueAlert("The fascists have enacted six policies!");
        }

        let hitlerElected = this.game.numFascistPolicyEnacted > 3 && this.game.electedChancellor.role == "Hitler";
        if (hitlerElected) {
          this.game.queueAlert("Hitler has been elected as the Chancellor!");
        }

        if (enactedEnough || hitlerElected) {
          winners.addPlayer(this.player, "Fascists");
        }
      },
    };
  }
};
