const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class WinIfWithNoCards extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (
          this.game.MaxRounds != 0 &&
          this.game.RoundNumber > this.game.MaxRounds
        ) {
          let min = 10000;
          let minPlayer;
          for (let player of this.game.players) {
            if (player.alive) {
              if (player.CardsInHand.length < min) {
                minPlayer = player;
                min = player.CardsInHand.length;
              }
            }
          }
          if (minPlayer == this.player) {
            winners.addPlayer(this.player, this.name);
          }
        }

        if (this.player.HasNoCards == true) {
          winners.addPlayer(this.player, this.name);
        }
        let nonHostAlive = this.game
          .alivePlayers()
          .filter((p) => p.role.name != "Host");
        if (nonHostAlive.length <= 1 && this.player.alive) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      start: function () {
        if (!this.game.hasGovernor) return;
        if (!this.game.enablePunctuation) {
          this.meetings["Give Response"].textOptions.alphaOnlyWithSpaces = true;
        }
      },
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
