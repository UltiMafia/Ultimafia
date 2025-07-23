const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class SacrificeSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Replace: {
        actionName: "Save",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          role: this.role,
          run: function () {
            this.role.savedPlayer = this.target;

            // power 5, lifespan 1
            this.target.giveEffect("CondemnImmune", 5, 1);
          },
        },
      },
    };

    this.listeners = {
      state: function () {
        if (this.game.getStateName() == "Night") {
          delete this.savedPlayer;
        }
      },
      immune: function (action, player) {
        if (player != this.savedPlayer) {
          return;
        }

        if (action.hasLabel("condemn")) {
          this.player.kill("condemn", this.actor);
        }
      },
    };
  }
};
