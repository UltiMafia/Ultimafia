const Card = require("../../Card");

module.exports = class KillTownOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death(player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }

        const alive = this.game.players.filter((p) => p.alive);

        for (const p of alive) {
          if (p.role === this.player.role) {
            return;
          }
        }

        for (const p of alive) {
          if (p.role.alignment === "Village") {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
