const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class ModifierBloodthirsty extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let visits = this.getVisits(this.actor);
          visits.map((v) => this.kill(v));
        },
      },
    ];
  }
};
