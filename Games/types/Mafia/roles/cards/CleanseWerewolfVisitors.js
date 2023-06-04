const Card = require("../../Card");
const { PRIORITY_CLEANSE_WEREWOLF_VISITORS } = require("../../const/Priority");

module.exports = class CleanseWerewolfVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_CLEANSE_WEREWOLF_VISITORS,
        labels: ["cleanse", "werewolf", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var cleansedWolves = {};

          for (let action of this.game.actions[0]) {
            if (
              action.target == this.actor &&
              action.actor.hasEffect("Werewolf") &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              action.actor.removeEffect("Werewolf", true);
              cleansedWolves[action.actor.id] = true;
            }
          }

          if (Object.keys(cleansedWolves).length == 0) return;

          for (let action of this.game.actions[0]) {
            if (
              action.actor &&
              cleansedWolves[action.actor.id] &&
              action.hasLabels(["kill", "werewolf"])
            ) {
              action.cancel();
            }
          }
        },
      },
    ];
  }
};
