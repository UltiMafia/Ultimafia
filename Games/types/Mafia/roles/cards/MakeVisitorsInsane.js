const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MakeVisitorsInsane extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_EFFECT_GIVER_DEFAULT,
        labels: ["hidden", "absolute", "giveEffect", "insanity"],
        run: function () {
          if (
            this.game.getStateName() !== "Night" &&
            this.game.getStateName() !== "Dawn"
          ) {
            return;
          }

          let visitors = this.getVisitors();
          for (let visitor of visitors) {
            if (this.dominates(visitor)) {
              visitor.giveEffect("Insanity");
            }
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Effect"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["hidden", "absolute", "giveEffect", "insanity"],
          run: function () {
            let visitors = this.getVisitors();
            for (let visitor of visitors) {
              if (this.dominates(visitor)) {
                visitor.giveEffect("Insanity");
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
