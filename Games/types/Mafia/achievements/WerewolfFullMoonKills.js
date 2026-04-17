const Achievements = require("../Achievements");

module.exports = class WerewolfFullMoonKills extends Achievements {
  constructor(name, player) {
    super(name, player);
    this.NightKills = 0;
    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Werewolf") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (!this.game.stateEvents || !this.game.stateEvents["Full Moon"]) {
          return;
        }
        this.NightKills++;
        if (this.NightKills >= 3) {
          this.FullMoonFeat = true;
        }
      },
      afterActions: function () {
        this.NightKills = 0;
      },
      aboutToFinish: function () {
        if (this.FullMoonFeat == true) {
          this.player.EarnedAchievements.push("Mafia62");
        }
      },
    };
  }
};
