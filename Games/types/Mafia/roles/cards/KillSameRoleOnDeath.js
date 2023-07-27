const Card = require("../../Card");

module.exports = class KillSameRoleOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        const hasCultLeader = this.game.players.filter(p => p.role.data.cultLeader).length > 0;
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

        for (const player of this.game.players) {
          if (player.alive && player.role.name === this.name) {
            player.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
