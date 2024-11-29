const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class CheckSuccessfulVisit extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let targets = this.getVisits(this.actor);
          let targetNames = targets.map((t) => t.name);

          if (this.actor.hasEffect("FalseMode")) {
            if (targetNames.length >= 1) return;
          }

          if (targetNames.length >= 1) {
            this.actor.queueAlert(
              `:invest: You learn that your visit to ${targetNames.join(
                ", "
              )} was successful.`
            );
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
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate", "hidden"],
          game: this.player.game,
          run: function () {
            let targets = this.getVisits(this.actor);
            let targetNames = targets.map((t) => t.name);

            if (this.actor.hasEffect("FalseMode")) {
              if (targetNames.length >= 1) return;
            }

            if (targetNames.length >= 1) {
              this.actor.queueAlert(
                `:invest: You learn that your visit to ${targetNames.join(
                  ", "
                )} was successful.`
              );
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
