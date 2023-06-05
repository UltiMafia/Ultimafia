const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class DaySlasher extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_ITEM_GIVER_DEFAULT,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() !== "Night") return;

          let visitors = this.actor.role.data.visitors;

          if (!visitors?.length) {
            this.actor.holdItem("Knife", { reveal: false });
            this.queueGetItemAlert("Knife", this.actor);
          }
        },
      },
    ];
  }
};
