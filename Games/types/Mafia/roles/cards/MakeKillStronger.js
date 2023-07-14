const Card = require("../../Card");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class MakeKillStronger extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Stronger": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.data.hasUsedStrength;
        },
        action: {
          labels: ["strong"],
          priority: PRIORITY_MODIFY_ACTION_LABELS,
          run: function () {
            if (this.target === "No") return;

            for (let action of this.game.actions[0]) {
              if (
                action.actors.includes(this.actor) &&
                action.hasLabel("kill")
              ) {
                action.power = Infinity;
                action.labels = [...action.labels, "absolute", "strong"];
                this.actor.role.data.hasUsedStrength = true;
              }
            }
          },
        },
      },
    };
  }
};
