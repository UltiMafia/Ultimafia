const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class WinIfWithAllCards extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (
          this.game.MaxRounds != 0 &&
          this.game.RoundNumber > this.game.MaxRounds
        ) {
          let max = -1;
          let maxPlayer;
          for (let player of this.game.players) {
            if (player.alive) {
              if (player.CardsInHand.length > max) {
                maxPlayer = player;
                max = player.CardsInHand.length;
              }
            }
          }
          if (maxPlayer == this.player) {
            winners.addPlayer(this.player, this.name);
            return;
          }
        }
        if(this.game.alivePlayers().filter((p) => p.role.name != "Host").length == 1 && this.player.alive){
          winners.addPlayer(this.player, this.name);
        return;
        }
        let playersWithCard = this.game.alivePlayers().filter((p) => p.role.name != "Host" && p != this.player && p.CardsInHand.length > 0);
          if (playersWithCard.length <= 0 && this.player.alive) {
             winners.addPlayer(this.player, this.name);
        return;
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
