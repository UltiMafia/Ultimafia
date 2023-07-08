const Card = require("../../Card");

module.exports = class WinWithFascists extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (this.game.fascistPolicyEnacted == 6 || this.game.hitlerChancellor == true) {
            winners.addPlayer(this.player, "Fascists");
        }
      },
    };
  }
};