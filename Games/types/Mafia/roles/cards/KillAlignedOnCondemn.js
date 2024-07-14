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

        if (this.player.role.alignment == "Cult") {
          var devotion = this.game.players.filter(
            (p) => p.alive && p.role.name == "Devotee"
          );
          if (devotion.length > 0) {
            var backUpTarget = devotion[0];
            backUpTarget.setRole(
              `${this.player.role.name}:${this.player.role.modifier}`,
              this.player.role.data
            );
            return;
          }
        }

        for (let p of this.game.alivePlayers()) {
          if (p.role.alignment === this.player.role.alignment) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
