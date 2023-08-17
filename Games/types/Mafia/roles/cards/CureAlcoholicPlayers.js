const Card = require("../../Card");
const { PRIORITY_CANCEL_ROLEBLOCK_ACTIONS } = require("../../const/Priority");

module.exports = class CureAlcoholicVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
        labels: ["cleanse", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          const alcoholicVisitors = this.getVisitors().filter(p => p.hasEffect("Alcoholic"));
          for (const v of alcoholicVisitors) {
            v.removeEffect("Alcoholic", true);
            this.blockActions(v, "alcoholic")
          }
        },
      },
    ];
  }
};
