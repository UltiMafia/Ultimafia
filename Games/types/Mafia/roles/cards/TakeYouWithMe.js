const Card = require("../../Card");

module.exports = class TakeYouWithMe extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (this.data.loves && player == this.player && this.data.loves.alive) {
          this.data.loves.kill("love", this.player, instant);
        }
      },
    };
  }
};
