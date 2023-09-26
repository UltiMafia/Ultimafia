const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfDead extends Card {
  constructor(role) {
    super(role);

    this.winCount = "Village";
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.player.alive && aliveCount == 1) {
          winners.addGroup("No one");
          return;
        }

        if (
          !this.player.alive &&
          this.deathType != "leave" &&
          this.deathType != "veg" &&
          confirmedFinished &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player) {
          this.deathType = deathType;
        }
      },
    };
  }
};
