const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CountVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["hidden", "absolute"],
        run() {
          if (this.game.getStateName() !== "Night") return;

          const { visitors } = this.actor.role.data;
          if (visitors) {
            const unique = new Set(visitors);
            this.actor.queueAlert(
              `:sy9a: You were visited by ${unique.size} people last night.`
            );
          }
        },
      },
    ];
  }
};
