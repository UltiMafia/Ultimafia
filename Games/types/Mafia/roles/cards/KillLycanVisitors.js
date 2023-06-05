const Card = require("../../Card");
const {
  PRIORITY_KILL_LYCAN_VISITORS_ENQUEUE,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class KillLycanVisitors extends Card {
  constructor(role) {
    super(role);

    // Store visitors before triggering kills since killing modifies visitor behavior
    this.actions = [
      {
        priority: PRIORITY_KILL_LYCAN_VISITORS_ENQUEUE,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0])
            if (
              action.target == this.actor &&
              action.actor.role.name == "Lycan" &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              if (!this.actor.role.data.lycanVisitors)
                this.actor.role.data.lycanVisitors = [];

              this.actor.role.data.lycanVisitors.push(action.actor);
            }
        },
      },
      {
        priority: PRIORITY_KILL_DEFAULT,
        power: 2,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var lycanVisitors = this.actor.role.data.lycanVisitors;

          if (lycanVisitors) {
            for (let visitor of lycanVisitors)
              if (this.dominates(visitor)) visitor.kill("basic", this.actor);

            this.actor.role.data.lycanVisitors = [];
          }
        },
      },
    ];
  }
};
