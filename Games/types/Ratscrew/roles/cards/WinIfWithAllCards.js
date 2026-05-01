const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class WinIfWithAllCards extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      // Win when you are the only alive non-Host player. Elimination is
      // handled by transferPileTo when the pile clears, so the cards-based
      // win check is no longer needed — the game always reaches a single
      // surviving player before this fires.
      check: function (counts, winners, aliveCount) {
        if (
          this.player.alive &&
          this.game.alivePlayers().filter((p) => p.role.name != "Host")
            .length === 1
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name != "Call Lie") {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          labels: ["hidden"],
          run: function () {
            if (this.actor.CardsInHand.length <= 0) {
              this.actor.HasNoCards = true;
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
