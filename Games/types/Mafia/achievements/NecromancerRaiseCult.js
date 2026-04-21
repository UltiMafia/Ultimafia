const Achievements = require("../Achievements");

module.exports = class NecromancerRaiseCult extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (this.player.role.name != "Necromancer") {
          return;
        }
        if (killer != this.player) {
          return;
        }
        if (this.game.getRoleAlignment(player.role.name) != "Cult") {
          return;
        }
        this.RaisedUndead = true;
      },
      aboutToFinish: function () {
        if (this.RaisedUndead == true) {
          this.player.EarnedAchievements.push("Mafia65");
        }
      },
    };
  }
};
