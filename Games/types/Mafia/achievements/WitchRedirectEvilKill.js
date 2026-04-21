const Achievements = require("../Achievements");

module.exports = class WitchRedirectEvilKill extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Witch") {
          return;
        }
        if (deathType != "basic") {
          return;
        }
        if (!killer || !killer.role) {
          return;
        }
        if (!killer.isEvil(true)) {
          return;
        }
        if (!player.isEvil(true)) {
          return;
        }
        if (killer == player) {
          return;
        }
        if (this.WitchRedirected) {
          this.EvilOnEvilKill = true;
        }
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Day/)) {
          this.WitchRedirected = false;
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (this.player.role.name == "Witch" && this.player.role.data.controlledActor) {
          this.WitchRedirected = true;
        }
      },
      aboutToFinish: function () {
        if (this.EvilOnEvilKill == true) {
          this.player.EarnedAchievements.push("Mafia60");
        }
      },
    };
  }
};
