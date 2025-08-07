const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");

module.exports = class TargetSelf50Percent extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_REDIRECT_ACTION,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (Random.randInt(0, 1) == 0) {
            this.redirectAllActions(this.actor, this.actor);
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Redirection", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_REDIRECT_ACTION,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            if (Random.randInt(0, 1) == 0) {
              this.redirectAllActions(this.actor, this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
