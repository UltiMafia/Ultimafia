const Achievements = require("../Achievements");

module.exports = class SurviveBulletproof extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      afterActions: function () {
        if (this.Saved) {
          return;
        }
        if (
          !this.player.role.modifier ||
          !this.player.role.modifier.split("/").includes("Bulletproof")
        ) {
          return;
        }
        for (let action of this.game.actions[0] || []) {
          if (
            action.HasBeenSavedByArmor &&
            action.target === this.player
          ) {
            this.Saved = true;
            break;
          }
        }
      },
      aboutToFinish: function () {
        if (this.Saved == true) {
          this.player.EarnedAchievements.push("Mafia56");
        }
      },
    };
  }
};
