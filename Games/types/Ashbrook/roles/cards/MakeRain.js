const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MakeRain extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Conjure Rain?": {
        states: ["Night"],
        flags: ["voting"],
        whileDead: true,
        shouldMeet: function (){
          return this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser"));
        },
        inputType: "boolean",
        action: {
          labels: ["effect", "cannotVote"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
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
          return !this.madeRain;
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return player == this.role.prevTarget;
}
