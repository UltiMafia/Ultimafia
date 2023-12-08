const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class PenguinEater extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();
          for (let v of visitors) {
            if (v.role.name == "Penguin" && this.dominates(v)) {
              v.kill("basic", this.actor);
            }
          }
        },
      },
    ];
  }
};
