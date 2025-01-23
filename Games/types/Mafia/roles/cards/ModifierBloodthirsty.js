const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class ModifierBloodthirsty extends Card {
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
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill"],
          run: function () {
            let visits = this.getVisits(this.actor);
            for(let v of visits){
               if (this.dominates(v)){
                 v.kill("basic", this.actor)
               }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
