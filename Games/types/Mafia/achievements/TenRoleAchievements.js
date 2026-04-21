const Achievements = require("../Achievements");
const AchievementData = require("../../../../data/Achievements");

module.exports = class TenRoleAchievements extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        const earned = new Set([
          ...(this.player.user.achievements || []),
          ...(this.player.EarnedAchievements || []),
        ]);
        const roles = new Set();
        for (let [, data] of Object.entries(AchievementData.Mafia)) {
          if (!earned.has(data.ID)) {
            continue;
          }
          if (!data.roles || data.roles.length == 0) {
            continue;
          }
          for (let r of data.roles) {
            roles.add(r);
          }
        }
        if (roles.size >= 10) {
          this.player.EarnedAchievements.push("Mafia81");
        }
      },
    };
  }
};
