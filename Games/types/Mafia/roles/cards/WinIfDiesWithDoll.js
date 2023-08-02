const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfDiesWithDoll extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        if (this.player.alive && this.data.dollDeath && !winners.groups[this.name]) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert("You cannot bear to have this haunted doll among your playthings anymore. You must ensure that it finds its way to the grave.");
      },
      death: function (player, killer, deathType) {
        if (player.hasItem("Doll") && player.role !== this.player.role) {
          this.data.dollDeath = true;
        }
      },
    };
  }
};
