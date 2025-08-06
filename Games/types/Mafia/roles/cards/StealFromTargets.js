const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealFromTargets extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_ITEM_TAKER_DEFAULT,
        labels: ["stealItem"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visits = this.getVisits(this.actor);
          visits.map((v) => this.stealAllItems(v));
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Item", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_ITEM_TAKER_DEFAULT,
          labels: ["stealItem"],
          run: function () {
            let visits = this.getVisits(this.actor);
            visits.map((v) => this.stealAllItems(v));
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
