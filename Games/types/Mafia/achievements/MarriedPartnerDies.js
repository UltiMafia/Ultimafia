const Achievements = require("../Achievements");

module.exports = class MarriedPartnerDies extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          !this.player.role.modifier ||
          !this.player.role.modifier.split("/").includes("Married")
        ) {
          return;
        }
        if (!this.player.role.partner) {
          return;
        }
        if (player == this.player.role.partner) {
          this.PartnerDied = true;
        }
      },
      aboutToFinish: function () {
        if (!this.PartnerDied) {
          return;
        }
        if (!this.player.alive) {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.EarnedAchievements.push("Mafia77");
        }
      },
    };
  }
};
