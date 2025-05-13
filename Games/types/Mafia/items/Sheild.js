const Item = require("../Item");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_MODIFY_ACTION } = require("../const/Priority");

module.exports = class Sheild extends Item {
  constructor(options, lifespan) {
    super("Sheild");

    this.lifespan = lifespan || Infinity;
    this.magicCult = options?.magicCult;
    this.broken = options?.broken;
    this.listeners = {
      state: function (stateInfo) {
        if (this.game.getStateName() != "Night") return;

        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: null,
          game: this.game,
          priority: PRIORITY_MODIFY_ACTION,
          item: this,
          labels: ["hidden", "Sheild"],
          run: function () {
            if (this.item.magicCult == true || this.broken == true) {
              return;
            }
            for (let action of this.game.actions[0]) {
              if (
                action.hasLabels(["hidden", "Sheild"]) &&
                action.item != this.item &&
                action.actor == this.actor
              ) {
                action.cancel(true);
              }
            }
            var alive = this.game.players.filter(
              (p) =>
                p.alive &&
                p != this.actor &&
                p.role.alignment == this.actor.role.alignment
            );
            if (alive.length > 0) {
              var randomTarget = Random.randArrayVal(alive);
              for (const action of this.game.actions[0]) {
                if (action.target === this.actor && action.hasLabel("kill")) {
                  action.target = randomTarget;
                }
              }
            }
            this.item.drop();
          },
        });

        this.game.queueAction(this.action);
      },
    };
  }
};
