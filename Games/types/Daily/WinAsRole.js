const DailyChallenge = require("../../core/DailyChallenge");

module.exports = class WinAsRole extends DailyChallenge {
  constructor(name, player) {
    super(name, player);

    this.listeners = {
      aboutToFinish: function () {
        if (!this.game.hasIntegrity || this.game.private) {
          return;
        }
        let roleName;
        for(let Challenge of this.player.user.dailyChallenges){
          if(Challenge[0] == this.ID){
            roleName == Challenge[2];
          }
        }
        if(this.player.role.name == roleName){
           if (
          Object.values(this.game.winners.groups)
            .flat()
            .find((p) => p === this.player)
        ) {
          this.player.DailyPayout += this.reward;
          this.player.DailyCompleted += 1;
          for(let Challenge of this.player.user.dailyChallenges){
          if(Challenge[0] == this.ID){
          this.player.user.dailyChallenges.splice(
          this.player.user.dailyChallenges.indexOf(Challenge),1);
          }
        }
        return;
        }
        }
     
        
      },
    };
  }
};
