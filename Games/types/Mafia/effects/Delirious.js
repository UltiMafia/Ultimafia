const Effect = require("../Effect");
const Action = require("../Action");

module.exports = class Delirious extends Effect {
  constructor(effecter, lifespan, types) {
    super("Delirious");
    this.effecter = effecter;
    this.lifespan = lifespan;
    if (types != null) {
      this.types = types;
    } else {
      this.types = ["Delirium"];
    }

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.effecter,
          target: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER+1,
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
