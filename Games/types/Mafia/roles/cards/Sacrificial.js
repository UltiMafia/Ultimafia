const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Sacrificial extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (this.hasVisits() === true && this.dominates(this.actor)) {
            this.player.kill("sacrifice", this.actor, true);
          }
        },
      },
    ];
  }
};
