const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class PermaMindRot extends Item {
  constructor(lifespan) {
    super("PermaMindRot");

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
            //if (this.dominates()) this.target.giveEffect("MindRot", this.actor);

            if (this.dominates(this.target)) {
              this.blockWithMindRot(this.target);
            }
            
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
