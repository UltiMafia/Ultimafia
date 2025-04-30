const Achievements = require("../Achievements");

module.exports = class MillerTowntell extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      Information: function (info) {
        if (
          info.target &&
          info.target == this.player &&
          info.creator &&
          (info.creator.role.name == "Cop" ||
            info.creator.role.name == "Detective")
        ) {
          if (
            info.isUnfavorable() &&
            (info.name == "Binary Alignment Info" || info.name == "Role Info")
          ) {
            this.hasBeenChecked = true;
          }
        }
      },
      aboutToFinish: function () {
        if (this.player.role.name != "Miller") {
          return;
        }
        if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player) &&
          this.player.alive == true &&
          this.hasBeenChecked == true
        ) {
          this.player.EarnedAchievements.push("Mafia33");
        }
      },
    };
  }
};
