const Card = require("../../Card");

module.exports = class WinIfGoalReached extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        if (aliveCount == 1 && this.player.alive) {
          winners.addPlayer(this.player, this.player.name);
          return;
        }
        if (this.player.hand.length === 0) {
          this.player.score = this.player.getOtherScoresSum();
        }
        if (this.game.drawDiscardPile.getTotalPileSize() === 0) {
          if (this.player.score === this.game.countLowestScore()) {
            let difference = Maths.abs(this.score - this.player.getOtherScoresSum());
            this.player.score = difference;
          }
        }
        if (this.player.score >= this.game.getPointGoal()) {
          winners.addPlayer(this.player, this.player.name);
          return;
        }
      },
    };
  }
};
