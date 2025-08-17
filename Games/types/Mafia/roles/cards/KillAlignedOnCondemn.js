const Card = require("../../Card");

module.exports = class KillAlignedOnCondemn extends Card {
  constructor(role) {
    super(role);

    if (role.alignment == "Independent") {
      return;
    }

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
      },
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        if (killType != "condemn") {
          return;
        }

        if (
          this.player.role.alignment == "Cult" ||
          this.player.faction == "Cult"
        ) {
          var devotion = this.game.players.filter(
            (p) => p.hasEffect("DevotionEffect")
          );
          if (devotion.length > 0) {
            var backUpTarget = devotion.filter(
              (p) => p.hasEffect("DevoteeEffect")
            );
            if (backUpTarget.length > 0) {
              backUpTarget.setRole(
                `${this.player.role.name}:${this.player.role.modifier}`,
                this.player.role.data,
                false,
                false,
                false,
                "No Change"
              );
              return;
            }
            this.game.events.emit("Devotion", this.player);
            return;
          }
        }

        for (let p of this.game.alivePlayers()) {
          if (p.faction === this.player.faction) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
