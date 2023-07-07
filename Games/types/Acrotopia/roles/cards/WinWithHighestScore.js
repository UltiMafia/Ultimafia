const Card = require("../../Card");

module.exports = class WinWithHighestScore extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (counts, winners, aliveCount) {
        /*let highestScore = 0;
        for (let player in this.game.players){
          if (player.score > highestScore){
            highestScore = player.score;
          }
        }
    
        if (this.player.score == highestScore){  
          winners.addPlayer(this.player, this.player.name);
        }*/
      },
    };
  }
};
