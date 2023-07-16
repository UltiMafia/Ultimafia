const Card = require("../../Card");

module.exports = class KillTownOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
        roleAssigned: function (player) {
            if (player !== this.player) {
              return;
            }
    
            this.game.queueAlert(
              `${this.player.name} has been elected as President! Protect them at all costs!`,
              0,
              this.game.players.filter(
                (p) => p.role.alignment === this.player.role.alignment
              )
            );
        },

      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }

        if (
          this.game.players.filter(
            (e) =>
              e.alive &&
              e.role.name === "Vice President" &&
              e.role.alignment === this.player.role.alignment
          ).length > 0
        ) {
          return;
        }

        const alive = this.game.players.filter((p) => p.alive);

        for (const p of alive) {
          if (p.role === this.player.role) {
            return;
          }
        }

        for (const p of alive) {
          if (p.role.alignment === this.player.role.alignment) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};