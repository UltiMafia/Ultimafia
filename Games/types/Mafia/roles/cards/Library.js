const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Library extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Meet at Library?": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.target == "No") return;

            this.actor.role.metLibrary = true;
            for (let p of this.game.players) {
              p.giveEffect("Speak Only Whispers", 1);
            }

            this.game.queueAlert(
              "You all meet in a library. Someone tells you to quiet your voice..."
            );
          },
        },
        shouldMeet() {
          return !this.metLibrary;
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return player == this.role.prevTarget;
}
