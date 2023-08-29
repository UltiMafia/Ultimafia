const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class ConvertVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_CONVERT_DEFAULT,
        labels: ["convert", "hidden"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.setRole("Cultist");
        },
      },
    ];
  }
};
