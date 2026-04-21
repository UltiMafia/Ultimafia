const Achievements = require("../Achievements");
const { MAFIA_FACTIONS } = require("../const/FactionList");

module.exports = class ExplosiveRetaliation extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (deathType != "bomb") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (
          !this.player.role.modifier ||
          !this.player.role.modifier.split("/").includes("Explosive")
        ) {
          return;
        }
        if (MAFIA_FACTIONS.includes(player.faction)) {
          this.BombedMafia = true;
        }
      },
      aboutToFinish: function () {
        if (this.BombedMafia == true) {
          this.player.EarnedAchievements.push("Mafia57");
        }
      },
    };
  }
};
