const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../const/Priority");

module.exports = class Scepter extends Item {
  constructor(lifespan) {
    super("Scepter");

    this.lifespan = lifespan || Infinity;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Day") return;

        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["hidden"],
          run: function () {
            if (this.dominates()) {
              this.actor.giveEffect("Crowned", this.actor);
            }
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
