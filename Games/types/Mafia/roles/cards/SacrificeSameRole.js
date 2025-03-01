const Card = require("../../Card");

module.exports = class SacrificeSameRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }
        if (!this.player.hasAbility(["Kill", "WhenDead"])) {
          return;
        }

        for (const player of this.game.players) {
          if (player.alive && player.role.name === "Sheep" && player.hasAbility(["Kill", "WhenDead"]) {
            player.kill("sheep", this.player, instant);
          }
        }
      },
    };
  }
};
