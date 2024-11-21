const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Vain extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
        
                   if (
            this.game.getStateName() != "Night" &&
            this.game.getStateName() != "Dawn"
          )
            return;

          if (!this.actor.alive) return;

          for (let action of this.game.actions[0]) {
            if (action.hasLabel("absolute")) {
              continue;
            }
            if (action.hasLabel("mafia")) {
              continue;
            }
            if (action.hasLabel("hidden")) {
              continue;
            }

            let toCheck = action.target;
            if (!Array.isArray(action.target)) {
              toCheck = [action.target];
            }

            if (
              action.actors.indexOf(this.actor) != -1 &&
              !action.hasLabel("hidden") &&
              action.target &&
              toCheck[0] instanceof Player
            ) {
              for (let y = 0; y < toCheck.length; y++) {
              if (toCheck[y].role.alignment == this.actor.alignment)) {
          let action = new Action({
            actor: this.actor,
            target: this.actor,
            game: this.game,
            labels: ["kill", "hidden"],
            run: function () {
              if (this.dominates()) this.target.kill("basic", this.actor, true);
            },
          });
          this.game.instantAction(action);
                  return;
                }
              }
            }
          }
        },
      },
    ];
  }
};
