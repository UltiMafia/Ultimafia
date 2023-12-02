const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealFromTargets extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_TAKER_DEFAULT,
        labels: ["stealItem"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;

          let visits = this.getVisitors(this.actor);
          visitors.map((v) => this.stealAllItems(v));
        },
      },
    ];
  }
};
