const Achievements = require("../Achievements");
const { CULT_FACTIONS } = require("../const/FactionList");

module.exports = class SamuraiKillConverter extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Samurai") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (this.game.getRoleAlignment(player.role.name) != "Cult") {
          return;
        }
        this.KilledConverter = true;
      },
      aboutToFinish: function () {
        if (this.KilledConverter == true) {
          this.player.EarnedAchievements.push("Mafia58");
        }
      },
    };
  }
};
