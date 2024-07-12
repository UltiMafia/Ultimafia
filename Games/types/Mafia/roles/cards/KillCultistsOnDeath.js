const Card = require("../../Card");

module.exports = class KillCultistsOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        const hasCultLeader =
          this.game.players.filter((p) => p.role.data.cultLeader).length > 0;
        if (!hasCultLeader) {
          this.data.cultLeader = true;
          this.player.queueAlert("You are the Cult Leader.");
        }
      },
      death: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }

        if (!this.data.cultLeader) {
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

        for (const player of this.game.players) {
          if (player.alive && player.role.name === "Cultist") {
            player.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
