const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Sacrificial extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (this.hasVisits() === true && this.dominates(this.actor)) {
            this.player.kill("sacrifice", this.actor, true);
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Kill", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden"],
          run: function () {
            if (this.hasVisits(this.actor) === true && this.dominates(this.actor)) {
              this.actor.kill("basic", this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
