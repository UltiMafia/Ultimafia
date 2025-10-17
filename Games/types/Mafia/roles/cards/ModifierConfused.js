const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class ModifierConfused extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (Random.randInt(0, 1) == 0) {
            this.blockWithDelirium(this.actor);
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
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["block", "hidden", "absolute"],
          run: function () {
            if (Random.randInt(0, 1) == 0) {
              this.actor.giveEffect("FalseMode", 1);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
