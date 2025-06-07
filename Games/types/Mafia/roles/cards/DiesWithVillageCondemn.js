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
            if(target != this.player.id){
              allVillageVoted = false;
            }
          }
        }
        if(allVillageVoted == true){
          return;
        }
        for (let voterId in meeting.votes) {
          let member = meeting.members[voterId];
          let target = meeting.votes[voterId] || "*";
          if (!target) continue;
          if (member.player.faction == "Village" && member.player.alive) {
            if(target == this.player.id){
            member.player.giveEffect("Voteless", -1);
            }
          }
        }
      },
      /*
      meetingFinish: function (meeting) {
        if (!this.player.hasAbility(["OnlyWhenAlive"])) {
          return;
        }

        if (meeting.name !== "Village") {
          return;
        }

        for (let member of meeting.members) {
          const player = member.player;
          if (!player.alive) {
            continue;
          }

          if (player.role.alignment != "Village") {
            continue;
          }

          const vote = meeting.votes[player.id];
          if (vote != this.player.id) {
            // a villager did not vote for this role
            return;
          }
        }

        let action = new Action({
          actor: this.player,
          target: this.player,
          game: this.game,
          labels: ["kill", "condemn", "hidden"],
          power: 5,
          run: function () {
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        });
        action.do();
      },
      */
    };
  }
};
