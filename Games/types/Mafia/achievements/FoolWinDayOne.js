const Achievements = require("../Achievements");

module.exports = class FoolWinDayOne extends Achievements {
  constructor(name, player) {
    super(name, player);

     this.listeners = {
        death: function (player, killer, deathType) {
            if (player == this.player && deathType == "condemn" && this.game.getStateInfo().dayCount == 1)
              this.FoolWinDayOne = true;
          },
      aboutToFinish: function (){
            if(this.player.role.name != "Fool"){
              return;
            }
            if(Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player) && this.FoolWinDayOne == true
        ){
           this.player.EarnedAchievements.push("Mafia8");
          }
      },
    };
    
  }
};
