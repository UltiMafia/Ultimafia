const Card = require("../../Card");

module.exports = class WinIfMostPoints extends Card {
  constructor(role) {
    super(role);
    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        const game = this.player.game;

        if (game.deck.length > 0) return;

        const scores = game.scores;
        let maxScore = -1;
        for (const id in scores) {
          if (scores[id] > maxScore) maxScore = scores[id];
        }
        if (scores[this.player.id] === maxScore && maxScore > 0) {
          winners.addPlayer(this.player, this.player.name);
        }
      },
    };
  }
};
