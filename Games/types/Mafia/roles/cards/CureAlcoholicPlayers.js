const Card = require("../../Card");
const { PRIORITY_CLEANSE_ALCOHOLIC_VISITORS } = require("../../const/Priority");

module.exports = class CureAlcoholicVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_CLEANSE_ALCOHOLIC_VISITORS,
        labels: ["cleanse", "alcoholic", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var cleansedDrunks = {};

          for (let action of this.game.actions[0]) {
            if (
              action.target == this.actor &&
              action.actor.hasEffect("Alcoholic") &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              action.actor.removeEffect("Alcoholic", true);
              cleansedDrunks[action.actor.id] = true;
            }
          }

          if (Object.keys(cleansedDrunks).length == 0) return;

          for (let action of this.game.actions[0]) {
            if (
              action.actor &&
              cleansedDrunks[action.actor.id] &&
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
