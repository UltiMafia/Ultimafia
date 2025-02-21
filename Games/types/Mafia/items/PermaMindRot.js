const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class PermaDelirium extends Item {
  constructor(lifespan) {
    super("PermaDelirium");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") return;

        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["hidden", "block"],
          run: function () {
            //if (this.dominates()) this.target.giveEffect("Delirium", this.actor);

            if (this.dominates(this.target)) {
              this.blockWithDelirium(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
      roleAssigned: function (player) {
        if (player != this.holder) return;
        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["hidden", "block"],
          run: function () {
            //if (this.dominates()) this.target.giveEffect("Delirium", this.actor);

            if (this.dominates(this.target)) {
              this.blockWithDelirium(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
