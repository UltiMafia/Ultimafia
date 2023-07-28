const Card = require("../../Card");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class SacrificeSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Sacrifice Self": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            if (this.isInsane()) return;

            this.actor.role.protectingTarget = this.target;
            this.target.giveEffect("KillImmune", 5, 1);
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        if (this.game.getStateName() == "Day") {
          delete this.protectingTarget;
        }
      },
      immune: function (action, player) {
        if (player != this.protectingTarget) {
          return;
        }

        if (this.player.hasEffect("Insanity")) return;

        if (action.hasLabel("kill")) {
          this.player.kill("basic", this.player);
        }
      },
    };
  }
};
