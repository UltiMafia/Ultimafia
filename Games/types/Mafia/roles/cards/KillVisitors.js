const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillVisitors extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill", "hidden", "absolute"],
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          let visitors = this.getVisitors();

          for (let visitor of visitors)
            if (this.dominates(visitor)) visitor.kill("basic", this.actor);
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Kill"])) {
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
            let visitors = this.getVisitors();

            for (let visitor of visitors)
              if (this.dominates(visitor)) visitor.kill("basic", this.actor);
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
