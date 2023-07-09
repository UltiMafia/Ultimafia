const Card = require("../../Card");

module.exports = class WinWithLiberals extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners) {
        if (this.game.liberalPolicyEnacted == 5 || this.game.hitlerAssassinated == true) {
            winners.addPlayer(this.player, "Liberals");
        }
      },
    };
  }
};