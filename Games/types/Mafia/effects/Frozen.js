const Effect = require("../Effect");
const Action = require("../Action");
const {
  PRIORITY_FULL_DISABLE,
  PRIORITY_EFFECT_REMOVER_DEFAULT,
} = require("../const/Priority");

module.exports = class Frozen extends Effect {
  constructor(power, lifespan) {
    super("Frozen");
    this.lifespan = lifespan ?? Infinity;
    this.isMalicious = true;

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.game.queueAction(
            new Action({
              actor: this.player,
              target: this.player,
              game: this.player.game,
              labels: ["block", "hidden", "absolute"],
              priority: PRIORITY_FULL_DISABLE,
              run: function () {
                if (this.dominates()) {
                  this.blockActions(this.actor);
                }
              },
            })
          );
          this.game.queueAction(
            new Action({
              actor: this.player,
              target: this.player,
              game: this.player.game,
              effect: this,
              labels: ["block", "hidden", "absolute"],
              priority: PRIORITY_EFFECT_REMOVER_DEFAULT,
              run: function () {
                if (this.hasVisitors(this.target)) {
                  this.effect.remove();
                } else if (this.actor.hasEffect("Frozen")) {
                  this.effect.cannotVoteEffect = this.actor.giveEffect(
                    "CannotVote",
                    1
                  );
                }
              },
            })
          );
        }
      },
    };
  }
  apply(player) {
    super.apply(player);
    this.cannotVoteEffect = player.giveEffect("CannotVote", 1);
  }
  remove() {
    this.cannotVoteEffect.remove();
    super.remove();
  }
};
