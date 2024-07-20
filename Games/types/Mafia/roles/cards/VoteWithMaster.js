const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");


module.exports = class VoteWithMaster extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Butler: {
        actionName: "Become Servent",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["visit"],
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {
            this.role.data.master = this.target;
          },
        },
      },
    };

    this.listeners = {
      meeting: function (meeting) {
        if (meeting.members[this.player.id] && meeting.name === "Village") {
          meeting.members[this.player.id].voteWeight = 0;
        }
      },
      vote: function (vote) {
        if (vote.meeting.name === "Village") {
          if(vote.voter == this.player){
            this.role.data.BulterVote = vote;
          }
          else if(vote.voter == this.role.data.master){
          this.role.data.MasterVote = vote;
          }
          else{
          return;
          }

          if(this.role.data.MasterVote.target === this.role.data.ButlerVote.target){
            vote.meeting.members[this.player.id].voteWeight = 1;
          }
          else{
            vote.meeting.members[this.player.id].voteWeight = 0;
          }
          

         
        }
    };
  }
};
