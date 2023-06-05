const Card = require("../../Card");

module.exports = class TakeMeWithYou extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (this.data.loves && player == this.data.loves && this.player.alive) {
          this.player.kill("love", this.data.loves, instant);
        }
      },
    };
  }
};
