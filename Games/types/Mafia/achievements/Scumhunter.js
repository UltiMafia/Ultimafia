const Achievements = require("../Achievements");

module.exports = class Scumhunter extends Achievements {
  constructor(name, player) {
    super(name, player);

    this.data.EvilVotesCount = 0;
     this.listeners = {
      vote: function (vote) {
        if (
          (vote.meeting.name === "Village") &&
          vote.voter === this.player
        ) {
        if(vote.target.isEvil()){
          this.data.isVotingEvil = true;
        }
          else{
            this.data.isVotingEvil = false;
          }
          
        }
      },
       afterActions: function () {
          if(this.data.isVotingEvil == true){
            this.data.isVotingEvil = false;
            this.data.EvilVotesCount++;
          }
       },
      aboutToFinish: function (){
            if(this.data.isVotingEvil == true){
            this.data.isVotingEvil = false;
            this.data.EvilVotesCount++;
          }

        if(this.data.EvilVotesCount >= 3){
          this.player.EarnedAchievements.push("Mafia5");
        }
      },
    };
    
  }
};
