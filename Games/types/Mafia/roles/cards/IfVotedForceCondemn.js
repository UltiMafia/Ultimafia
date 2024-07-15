const Card = require("../../Card");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class IfVotedForceCondemn extends Card {
  constructor(role) {
    super(role);



      this.listeners = {
      vote: function (vote) {
        if (vote.meeting.name === "Village" && vote.target === this.player.id) {
          if(this.player.role.data.hasBeenVoted) return;

          this.player.role.data.hasBeenVoted = true;

          if(this.game.getRoleAlignment(vote.voter.getRoleAppearance().split(" (")[0]) != "Village"){
            return;
          }

          for (const player of this.game.alivePlayers()) {
            player.giveEffect("CannotBeVoted", 1);
          }
          vote.voter.kill("condemn", this.player, true);
        }
      },
    };
  }
};
