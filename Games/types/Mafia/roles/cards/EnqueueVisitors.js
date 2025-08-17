const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_VISITORS_ENQUEUE } = require("../../const/Priority");

module.exports = class EnqueueVisitors extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_VISITORS_ENQUEUE,
        labels: ["absolute", "hidden"],
        run: function () {
          this.actor.role.data.visitors = [];
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            let toCheck = action.target;
            if (!Array.isArray(action.target)) {
              toCheck = [action.target];
            }

            for (let target of toCheck) {
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
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_VISITORS_ENQUEUE,
          labels: ["absolute", "hidden"],
          role: this,
          run: function () {
            this.role.data.visitors = [];

            for (let action of this.game.actions[0]) {
              let toCheck = action.target;
              if (!Array.isArray(action.target)) {
                toCheck = [action.target];
              }

              for (let target of toCheck) {
                if (target == this.actor && !action.hasLabel("hidden")) {
                  if (!this.role.data.visitors) this.role.data.visitors = [];

                  this.role.data.visitors.push(action.actor);
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
