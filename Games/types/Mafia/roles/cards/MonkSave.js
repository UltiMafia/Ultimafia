const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class MonkSave extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Monk Save": {
        actionName: "Save",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            this.actor.role.savedPlayer = this.target;

            // power 5, lifespan 2
            this.target.giveEffect("KillImmune", 5, 2);
            this.target.giveEffect("CondemnImmune", 5, 2);
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

        if (action.hasLabel("kill") || action.hasLabel("condemn")) {
          this.savedCounter += 1;
          this.actor.queueAlert(
            `You rescue ${this.target.name} from an attempt on their life and bring them back to your monastery.`
          );
        }
      },
    };
  }
};
