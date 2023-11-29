const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAllFrozen extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        var frozenCount = 0;

        for (let player of this.game.players) {
          let isFrozen = player.hasEffect("Frozen");

          if (player.alive && (isFrozen || player.role.name === "Snowman"))
          frozenCount++;
        }

        if (frozenCount === aliveCount)
          winners.addPlayer(this.player, this.name);
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          "It's time for Hell to freeze over - turn this town into a winter wonderland!"
        );
      },
    };
  }
};
