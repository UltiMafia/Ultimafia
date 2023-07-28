const Card = require("../../Card");
const { PRIORITY_VILLAGE } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        type: "Village",
        states: ["Day"],
        targets: { include: ["alive"], exclude: [cannotBeVoted] },
        flags: ["group", "speech", "voting"],
        whileDead: true,
        speakDead: true,
        action: {
          labels: ["kill", "condemn", "hidden"],
          priority: PRIORITY_VILLAGE,
          power: 3,
          run: function () {
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        },
      },
    };

    this.listeners = {
      vote: function (vote) {
        if (this.player.alive) return;
        if (vote.meeting.name === "Village" &&
          vote.voter === this.player &&
          vote.target !== "*"){
            this.player.giveEffect("CannotVote");
            this.player.queueAlert("You have used your final vote! You may no longer vote for the rest of the game!");
        }
      },
      death: function (player, killer, deathType){
        if (player != this.player) return;

        player.queueAlert("Now that you have died, you have one vote left that you can use on another player. Use it wisely!");
      }
      }
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted") || !player.alive;
}
