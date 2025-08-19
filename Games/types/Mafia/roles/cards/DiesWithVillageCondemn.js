const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class DiesWithVillageCondemn extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      PreVotingPowers: function (meeting) {
        let targetsWithVillageVoter = [];
        let allVillageVoted = true;
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (member.player.faction == "Village" && member.player.alive) {
            if (target != this.player.id) {
              allVillageVoted = false;
            }
          }
        }
        if (allVillageVoted == true) {
          return;
        }
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (member.player.faction == "Village" && member.player.alive) {
            if (target == this.player.id) {
              member.player.giveEffect("Voteless", -1);
            }
          }
        }
      },
    };
  }
};
