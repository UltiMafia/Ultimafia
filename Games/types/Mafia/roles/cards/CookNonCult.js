const Card = require("../../Card");

module.exports = class CookNonCult extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (deathType != "condemn") {
          return;
        }

        if (player.role.alignment == "Cult") {
          return;
        }

        if (!this.player.alive) {
          return;
        }

        let cult = this.game
          .alivePlayers()
          .filter((p) => p.role.alignment == "Cult");
        for (let p of cult) {
          p.holdItem("Food", "Stew");
          p.holdItem("Food", "Stew");
        }
        this.game.queueAlert(
          `${player.name} was cooked into a delicious stew!`,
          0,
          cult
        );
      },
    };
  }
};
