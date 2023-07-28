const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ReplaceLeaderIfKilled extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.hasEffect("Insanity")) return;
        
        var aliveCount = this.game.alivePlayers().length;
        
        if (player.role.alignment = "Leader" &&
          aliveCount >= 5 &&
          player != this.player)
          this.player.setRole(player.role.name);
      },
    }
  }
};
