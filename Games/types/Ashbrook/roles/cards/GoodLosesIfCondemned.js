const Card = require("../../Card");

module.exports = class GoodLosesIfCondemned extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) return;
        if (killType !== "condemn") return;
        if (this.player.hasEffect("Insanity")) return;

        this.game.queueAlert(`${player.name} was the Fool.`);
        this.game.evilWin = true;
      },
    };
  }
};
