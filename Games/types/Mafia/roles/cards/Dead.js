const Card = require("../../Card");

module.exports = class Dead extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player != this.player) {
          return;
        }
        this.game.queueDeath(this.player);
      },
    };
  }
};
