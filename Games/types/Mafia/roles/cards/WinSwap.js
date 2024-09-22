const Card = require("../../Card");
const { PRIORITY_WIN_SWAP } = require("../../const/Priority");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class WinSwap extends Card {
  constructor(role) {
    super(role);

      this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["Swap"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          this.actor.role.data.ShouldFlipWinCons = true;
        },
      },
    ];

    this.winCheck = {
      priority: PRIORITY_WIN_SWAP,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {

        let losers = []
        if(this.actor.role.data.ShouldFlipWinCons){
              for(let x = 0; x < this.game.players.length; x++){
                if(!Object.values(winners.groups).flat().find((p) => p === this.game.players [x])){
                  losers.push(this.game.players [x])
                }
              }
              for(let y = 0; y < this.game.players.length; y++){
                if(Object.values(winners.groups).flat().find((p) => p === this.game.players [y])){
                  if(this.game.getRoleAlignment(this.game.players [y].role.name) == "Independent"){
                    winners.removeGroup(this.game.players [y].role.name);
                  }
                  else{
                    winners.removeGroup(this.game.players [y].faction);
                  }
                }
              }
              for(let r = 0; r < losers.length; r++){
                if(Object.values(winners.groups).flat().find((p) => p === losers [r])){
                  if(this.game.getRoleAlignment(losers [r].role.name) == "Independent"){
                    winners.addPlayer(losers [r], losers [r].role.);
                  }
                  else{
                    winners.addPlayer(losers [r], role.player.faction);
                  }
                }
              }
        }

        if(Object.values(winners.groups).flat().find((p) => p === this.player)){
          return;
        }
        
        if ((winners.groups[this.player.faction]) {
          winners.addPlayer(this.player, this.player.faction);
        }
      },
    };
  }
};
