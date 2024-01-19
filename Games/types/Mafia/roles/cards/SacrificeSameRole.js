const Card = require("../../Card");

module.exports = class SacrificeSameRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }

        for (const player of this.game.players) {
          if (player.alive && player.role.name === "Sheep") {
            player.kill("sheep", this.player, instant);
          }
        }
      }
    }
  }
};
