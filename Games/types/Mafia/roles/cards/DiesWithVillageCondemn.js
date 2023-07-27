const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class DiesWithVillageCondemn extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      meetingFinish: function (meeting) {
        if (!this.player.alive) {
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
            if (this.dominates()) this.target.kill("condemn", this.player);
          },
        });
        action.do();
      },
    };
  }
};
