const Achievements = require("../Achievements");
const Action = require("../Action");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class HellhoundEat extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.EatenAlignments = [];
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          killer == this.player &&
          deathType == "eaten" &&
          this.player.role.name == "Hellhound"
        )
          if (
            !this.EatenAlignments.includes(
              this.game.getRoleAlignment(player.role.name)
            )
          ) {
            this.EatenAlignments.push(
              this.game.getRoleAlignment(player.role.name)
            );
          }
      },
      aboutToFinish: function () {
        if (this.EatenAlignments.length >= 2) {
          if (
            Object.values(this.game.winners.groups)
              .flat()
              .find((p) => p === this.player)
          ) {
            this.player.EarnedAchievements.push("Mafia29");
          }
        }
      },
    };
  }
};
