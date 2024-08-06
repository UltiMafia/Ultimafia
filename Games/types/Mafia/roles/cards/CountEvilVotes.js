const Card = require("../../Card");
const Action = require("../../../../core/Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CountEvilVotes extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT+1,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Day") return;

          let villageMeeting = this.game.getMeetingByName("Village");

          //New code
          const voteCounts = Object.values(villageMeeting.votes).reduce(
            (acc, vote) => {
              acc[vote] = (acc[vote] || 0) + 1;
              return acc;
            },
            {}
          );

          const minVotes = Math.min(...Object.values(voteCounts));
          const maxVotes = Math.max(...Object.values(voteCounts));
          let villageVotes = villageMeeting.votes;
          this.actor.role.data.evilVoted = false;

          for(let x of villageVotes){

            if(this.game.getRoleAlignment(x.voter.getRoleAppearance().split(" (")[0]) == "Cult" || this.game.getRoleAlignment(x.voter.getRoleAppearance().split(" (")[0]) == "Mafia"){
              if(x.target == maxvotes){
                this.actor.role.data.evilVoted = true;
              }
            }
            
          }

        },
      },
        {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let outcome = "No";
          var alert;

          if(this.actor.hasEffect("FalseMode")){
            if(this.actor.role.data.evilVoted){
              this.actor.role.data.evilVoted = false;
            }
            else{
              this.actor.role.data.evilVoted = true;
            }
          }

        if(this.actor.role.data.evilVoted){
          alert = `:invest: You learn that at least 1 Evil Player voted for the Condemn Target!`;
        }
        else{
          alert = `:invest: You learn that no evil players voted for the Condemn Target!`;
        }

        

          
          this.game.queueAlert(alert);

        },
      },
    ];
  }
};
