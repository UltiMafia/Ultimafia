const Card = require("../../Card");
const modifiers = require("../../../../../data/modifiers");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class MakePlayerLeadGroupActions extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Make Kill Leader": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["visit"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 3,
          run: function () {
            if (!this.dominates()) {
              return;
            }
            for (let action of this.game.actions[0]) {
              if (
                action.actors.includes(this.target) &&
                action.actors.length > 1
              ) {
                for (let player of action.actors) {
                  if (player != this.target) {
                    action.actors.splice(action.actors.indexOf(player), 1);
                  }
                }
                //action.labels = [...action.labels, "hidden"];
              }
            }
          },
        },
      },
    };
  }
};
