const Card = require("../../Card");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class SacrificeSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Sacrifice Self": {
        states: ["Day"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            this.actor.role.protectingTarget = this.target;
            this.target.giveEffect("CondemnImmune", Infinity, 1);
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        if (this.game.getStateName() == "Night") {
          delete this.protectingTarget;
        }
      },
      immune: function (action, player) {
        if (player != this.protectingTarget) {
          return;
        }

        if (action.hasLabel("condemn")) {
          this.player.kill("sacrifice", this.player);
        }
      },
    };
  }
};
