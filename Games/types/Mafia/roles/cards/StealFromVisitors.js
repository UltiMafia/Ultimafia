const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealFromVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_TAKER_DEFAULT,
        labels: ["stealItem"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let visits = this.getVisits(this.actor);
          visits.map((v) => this.stealAllItems(v));
        },
      },
    ];
  }
};
