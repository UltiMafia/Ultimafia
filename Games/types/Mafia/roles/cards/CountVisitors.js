const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CountVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() !== "Night") return;

          let visitors = this.actor.role.data.visitors;
          if (visitors) {
            let unique = new Set(visitors);
            this.actor.queueAlert(
              `:sy9a: You were visited by ${unique.size} people last night.`
            );
          }
        },
      },
    ];
  }
};
