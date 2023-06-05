const Card = require("../../Card");
const { PRIORITY_BLOCK_VISITORS } = require("../../const/Priority");

module.exports = class BlockVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_BLOCK_VISITORS,
        labels: ["block", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.target == this.actor && !action.hasLabel("hidden")) {
              for (let _action of this.game.actions[0]) {
                if (
                  _action.priority > this.priority &&
                  !_action.hasLabel("absolute")
                ) {
                  _action.cancelActor(action.actor);
                }
              }
            }
          }
        },
      },
    ];
  }
};
