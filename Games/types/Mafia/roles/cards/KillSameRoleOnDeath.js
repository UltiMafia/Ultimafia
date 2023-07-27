const Card = require("../../Card");

module.exports = class KillSameRoleOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        if (
          !Object.values(this.game.players).find(
            (e) => e.role.data.cultLeader === true
          )
        ) {
          this.data.cultLeader = true;
          this.player.queueAlert("You are the Cult Leader.");
        }
      },
      death: function (player, killer, deathType, instant) {
        if (player === this.player && this.data.cultLeader) {
          for (const player of this.game.players) {
            if (player.alive && player.role.name === this.name) {
              player.kill("basic", killer, instant);
            }
          }
        }
      },
    };
  }
};
