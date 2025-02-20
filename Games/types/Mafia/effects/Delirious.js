const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class CursedVote extends Effect {
  constructor(effecter, lifespan) {
    super("Delirious");
    this.effecter = effecter;
    this.lifespan = lifespan;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.effecter,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["block", "hidden"],
          run: function () {
            if (this.actor.hasAbility(["Delirium"])) {
              this.blockWithMindRot(this.target, true);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
