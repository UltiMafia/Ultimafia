const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Weak extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          for (let action of this.game.actions[0]) {
            if (action.actor == this.actor && !action.hasLabel("hidden")) {
              if (action.actor.role.alignment !== action.target.role.alignment) {
                if (this.dominates()) this.target.kill("otherAlignment", this.actor);
              }
            }
          }
        },
      },
    ];
  }
};
