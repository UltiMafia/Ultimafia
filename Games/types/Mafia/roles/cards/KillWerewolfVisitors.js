const Card = require("../../Card");
const {
  PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
  PRIORITY_KILL_DEFAULT,
} = require("../../const/Priority");

module.exports = class KillWerewolfVisitors extends Card {
  constructor(role) {
    super(role);

    // Store visitors before triggering kills since killing modifies visitor behavior
    this.actions = [
      {
        priority: PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0])
            if (
              action.target == this.actor &&
              action.actor.role.name == "Werewolf" &&
              action.priority > this.priority &&
              !action.hasLabel("hidden")
            ) {
              if (!this.actor.role.data.werewolfVisitors)
                this.actor.role.data.werewolfVisitors = [];

              this.actor.role.data.werewolfVisitors.push(action.actor);
            }
        },
      },
      {
        priority: PRIORITY_KILL_DEFAULT,
        power: 2,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var werewolfVisitors = this.actor.role.data.werewolfVisitors;

          if (werewolfVisitors) {
            for (let visitor of werewolfVisitors)
              if (this.dominates(visitor)) visitor.kill("basic", this.actor);

            this.actor.role.data.werewolfVisitors = [];
          }
        },
      },
    ];
  }
};
