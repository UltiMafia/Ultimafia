const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ReplaceDeityIfKilled extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player.role.alignment = "Deity" &&
          aliveCount >= 5 &&
          player != this.player)
          this.player.setRole(this.name);
      },
    }
  }
};
