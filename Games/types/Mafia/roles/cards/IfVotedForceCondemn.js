const Card = require("../../Card");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class IfVotedForceCondemn extends Card {
  constructor(role) {
    super(role);

        this.listeners = {
      vote: function (vote) {
        if (
          vote.meeting.name === "Village" &&
          vote.target === this.player.id
        ) {
          if(this.player.role.data.hasBeenVoted) return;
          player.role.data.hasBeenVoted = true;
          if(this.game.getRoleAlignment(vote.voter.getRoleAppearance().split(" (")[0]) != "Village"){
            return;
          }
          let action = new Action({
            actor: this.player,
            target: vote.voter,
            game: this.game,
            labels: ["overthrow"],
            priority: PRIORITY_OVERTHROW_VOTE,
            run: function () {
              if (this.dominates()){ 
               //this.target.kill("curse", this.actor, true);

              for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                if (action.target === this.target) {
                  return;
                }
              }
            }
                for (const player of this.game.alivePlayers()) {
                  player.giveEffect("CannotChangeVote", -1);
                }
              }
            },
          });

          this.game.instantAction(action);
        }
      },
    };
  }
};
