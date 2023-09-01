const Card = require("../../Card");
const { PRIORITY_FOLLOWER } = require("../../const/Priority");

module.exports = class MakeRain extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Conjure Rain?": {
        states: ["Night"],
        flags: ["voting"],
        whileDead: true,
        inputType: "boolean",
        action: {
          labels: ["effect", "cannotVote"],
          priority: PRIORITY_FOLLOWER,
          run: function () {
            if (this.target == "No") return;

            this.actor.role.madeRain = true;

            if (this.isInsane()) return;

            for (let p of this.game.players) {
              p.giveEffect("CannotBeVoted", 1);
            }

            this.game.queueAlert(
              "Voting has been cancelled."
            );
          },
        },
        shouldMeet() {
          return !this.madeRain && (this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser")));
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return player == this.role.prevTarget;
}
