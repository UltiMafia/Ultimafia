const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinInsteadOfVillage extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      check: function (counts, winners, aliveCount) {
        if (!this.player.alive) {
          return;
        }
        if (winners.groups["Village"]) {
          winners.addPlayer(this.player, this.player.role.name);
          winners.removeGroup("Village");
        } else if (winners.groups["Autocrat"]) {
          winners.addPlayer(this.player, this.player.role.name);
        }
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        this.game.queueAlert(
          "There is a rumor that if the Village wipes out their malcontents, an Autocrat will buy up all of the land…"
        );
      },
    };
  }
};
