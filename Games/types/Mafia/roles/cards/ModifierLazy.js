const Card = require("../../Card");
const { PRIORITY_MODIFY_ACTION_DELAY } = require("../../const/Priority");

module.exports = class ModifierLazy extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        labels: ["delayAction"],
        priority: PRIORITY_MODIFY_ACTION_DELAY,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor)) {
              this.game.dequeueAction(action, true);
              action.delay = 1;
              this.game.queueAction(action);
            }
          }
        },
      }
    ];
  }
};
