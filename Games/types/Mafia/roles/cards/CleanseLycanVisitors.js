const Card = require("../../Card");
const { PRIORITY_CLEANSE_LYCAN_VISITORS } = require("../../const/Priority");

module.exports = class CleanseLycanVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_CLEANSE_LYCAN_VISITORS,
        labels: ["cleanse", "lycan", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var cleansedWolves = {};

          for (let action of this.game.actions[0]) {
            if (
              action.target == this.actor &&
              action.actor.hasEffect("Lycan") &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              action.actor.removeEffect("Lycan", true);
              cleansedWolves[action.actor.id] = true;
            }
          }

          if (Object.keys(cleansedWolves).length == 0) return;

          for (let action of this.game.actions[0]) {
            if (
              action.actor &&
              cleansedWolves[action.actor.id] &&
              action.hasLabels(["kill", "lycan"])
            ) {
              action.cancel();
            }
          }
        },
      },
    ];
  }
};
