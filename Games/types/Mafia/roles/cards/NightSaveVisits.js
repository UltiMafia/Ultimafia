const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class NightSaveVisits extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_KILL_DEFAULT,
        labels: ["kill"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let visits = this.getVisits(this.actor);
          visits.map((v) => this.kill(v));
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
          priority: PRIORITY_NIGHT_SAVER,
          labels: ["save"],
          run: function () {
            let visits = this.getVisits(this.actor);
            for (let v of visits) {
              if (this.dominates(v)) {
                 this.heal(1, v);
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
