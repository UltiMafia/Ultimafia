const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MakeRain extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Conjure Rain?": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["effect", "cannotVote"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          role: this.role,
          run: function () {
            if (this.target == "No") return;

            this.role.madeRain = true;
            for (let p of this.game.players) {
              p.giveEffect("CannotBeVoted", 1);
            }

            this.game.queueAlert(
              "There is a large downpour… Voting has been cancelled."
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
