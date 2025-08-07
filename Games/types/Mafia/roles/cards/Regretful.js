const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Regretful extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let visits = this.getVisits(this.actor);
          let killers = visits.map((v) => this.getVisitors(v, "kill"));

          if (killers.length == 0) {
            return;
          } else if (this.dominates(this.actor)) {
            this.actor.kill("basic", this.actor);
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Modifier", "Kill"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden", "absolute"],
          run: function () {
            let visits = this.getVisits(this.actor);
            let killers = visits.map((v) => this.getVisitors(v, "kill"));

            if (killers.length == 0) {
              return;
            } else if (this.dominates(this.actor)) {
              this.actor.kill("basic", this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
