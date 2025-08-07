const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class GivePermaDelirium extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      revival: function (player) {
        if (player == this.player) {
          if (this.DeliriousVictim != null && this.player.alive) {
            this.DeliriousVictim.remove();
          }
        }
      },
      death: function (player, killer, instant) {
        if (
          player == this.player &&
          this.hasAbility(["Delirium", "WhenDead", "Modifier"])
        ) {
          let alive = this.game.alivePlayers();
          var villagePlayers = alive.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Village"
          );
          var villageTarget = Random.randArrayVal(villagePlayers);
          this.DeliriousVictim = villageTarget.giveEffect(
            "Delirious",
            this.player,
            1,
            ["Delirium", "WhenDead", "Modifier"],
            this
          );
        }
      },
    };
  }
};
