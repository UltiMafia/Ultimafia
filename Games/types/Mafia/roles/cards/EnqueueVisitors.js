const Card = require("../../Card");
const { PRIORITY_VISITORS_ENQUEUE } = require("../../const/Priority");

module.exports = class EnqueueVisitors extends Card {
  constructor(role) {
    super(role);
    this.actions = [
      {
        priority: PRIORITY_VISITORS_ENQUEUE,
        labels: ["absolute", "hidden"],
        run() {
          this.actor.role.data.visitors = [];
          if (this.game.getStateName() != "Night") return;

          for (const action of this.game.actions[0]) {
            let toCheck = action.target;
            if (!Array.isArray(action.target)) {
              toCheck = [action.target];
            }

            for (const target of toCheck) {
              if (target == this.actor && !action.hasLabel("hidden")) {
                if (!this.actor.role.data.visitors)
                  this.actor.role.data.visitors = [];

                this.actor.role.data.visitors.push(action.actor);
              }
            }
          }
        },
      },
    ];
  }
};
