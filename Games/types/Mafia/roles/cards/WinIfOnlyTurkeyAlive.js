const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfOnlyTurkeyAlive extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount) {
        for (let player of this.game.players) {
          if (player.alive && player.role.name !== "Turkey") {
            return;
          }
        }

        winners.addPlayer(this.player, this.name);
      },
    };
    this.listeners = {
      "start": function () {
          for (let player of this.game.players) {
              if (
                  player.role.name === "Turkey" &&
                  player !== this.player
              ) {
                  this.revealToPlayer(player);
              }
          }

          if (!this.game.alertedTurkeyInGame) {
              this.game.queueAlert("A turkey runs rampant, consuming all the food.");
              this.game.alertedTurkeyInGame = true;
          }
      }
    }
  }
};
