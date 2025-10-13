const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinAllProbed extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if(!this.player.alive){
        return;
        }

        let lovers = [this.player];
        for(let effect of this.player.effects){
            if(effect.name == "Lovesick"){
                if(!lovers.includes(effect.lover)){
                lovers.push(effect.lover);
                }
            }
        }

        for (let player of this.game.alivePlayers()) {
            if(!lovers.includes(player)){
                return;
            }
        }

        winners.addPlayer(this.player, this.name);
      },
    };
  }
};
