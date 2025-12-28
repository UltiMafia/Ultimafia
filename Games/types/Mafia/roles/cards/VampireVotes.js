const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class VampireVotes extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      PreVotingPowers: function (meeting) {
        let targetsWithVillageVoter = [];
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (member.player.getFaction() == "Village") {
            targetsWithVillageVoter.push(target);
          }
        }
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (
            member.player.getFaction() == this.player.getFaction() &&
            !targetsWithVillageVoter.includes(target)
          ) {
            member.player.giveEffect("Voteless", -1);
          }
        }
      },
    };
  }
};
