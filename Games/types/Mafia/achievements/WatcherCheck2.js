const Achievements = require("../Achievements");

module.exports = class WatcherCheck2 extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.GoodChecks = 0;
    this.hasChecked = [];
    this.listeners = {
      Information: function (info) {
        if (
          info.creator &&
          info.creator == this.player &&
          this.player.role.name == "Watcher"
        ) {
          if (info.isTrue()) {
            for (let player of info.mainInfo) {
              if (player.isEvil(true) == true) {
                this.GoodChecks++;
                return;
              }
            }
          }
        }
      },
      aboutToFinish: function () {
        if (
          this.GoodChecks >= 2 &&
          this.player.alive &&
          this.player.role.name == "Watcher"
        ) {
          this.player.EarnedAchievements.push("Mafia31");
        }
      },
    };
  }
};
