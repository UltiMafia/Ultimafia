const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class VoteToBlockVotes extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      PreVotingPowers: function (meeting) {
        if (this.player.role.data.master == 0) {
          return;
        }
        if (!this.hasAbility(["Voting"])) {
          return;
        }
        
        if(meeting.votes && Object.entries(meeting.votes).length <= 3){
          return;
        }
        this.player.role.VotePower = 0;
        let masterTarget;
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (member.player == this.player) {
            masterTarget = target;
          }
        }
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (target == masterTarget) {
            member.player.giveEffect("Voteless", -1);
          }
        }
      },
      PostVotingPowers: function (meeting) {
        this.player.role.VotePower = 1;
      },
      /*
      meeting: function (meeting) {
        if (meeting.name != "Village" || this.player.role.data.master == 0)
          return;
        if (meeting.members[this.player.role.data.master.id]) {
          meeting.members[this.player.role.data.master.id].voteWeight = 2;
        }
        if (meeting.members[this.player.id]) {
          meeting.members[this.player.id].voteWeight = 0;
        }
      },
      */
    };
  }
};
