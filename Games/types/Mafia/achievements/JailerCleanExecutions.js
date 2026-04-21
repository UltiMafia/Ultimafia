const Achievements = require("../Achievements");

module.exports = class JailerCleanExecutions extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.EvilExecutions = 0;
    this.InnocentExecutions = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Jailer") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (deathType != "basic") {
          return;
        }
        if (player != this.player.role.data.prisoner) {
          return;
        }
        if (player.isEvil(true)) {
          this.EvilExecutions++;
        } else {
          this.InnocentExecutions++;
        }
      },
      aboutToFinish: function () {
        if (this.EvilExecutions >= 1 && this.InnocentExecutions == 0) {
          this.player.EarnedAchievements.push("Mafia51");
        }
      },
    };
  }
};
