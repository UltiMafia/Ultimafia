const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class HealVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();

          for (let visitor of visitors) {
            this.heal(1, visitor);
          }
        },
      },
    ];
  }
};
