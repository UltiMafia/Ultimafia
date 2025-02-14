const Achievements = require("../Achievements");

module.exports = class VillageVictory extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.data.EvilVotesCount = 0;
     this.listeners = {
      aboutToFinish: function (){
            if(this.player.role.alignment != "Village"){
              return;
            }
            if(  Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        )){
           this.player.EarnedAchievements.push("Mafia1");
          }
      },
    };
    
  }
};
