const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_UNTARGETABLE } = require("../../const/Priority");

module.exports = class Ascetic extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_UNTARGETABLE,
        labels: ["stop", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          this.makeUntargetable(this.actor, "kill");
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["OnlyWhenAlive"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          priority: PRIORITY_UNTARGETABLE,
          game: this.player.game,
          labels: ["stop", "hidden"],
          run: function () {
            this.makeUntargetable(this.actor, "kill");
          },
        });
        this.game.queueAction(action);
      },
    };
  }
};
