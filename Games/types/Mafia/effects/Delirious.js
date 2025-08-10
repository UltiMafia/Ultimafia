const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../const/Priority");

module.exports = class Delirious extends Effect {
  constructor(effecter, lifespan, types, role) {
    super("Delirious");
    this.effecter = effecter;
    this.effecterRole = role;
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
          effect: this,
          priority: -999,
          labels: ["block", "hidden"],
          run: function () {
            if(!this.target.isDelirious()){
              return;
            }
            if (this.actor.hasAbility(this.effect.types)) {
              this.blockWithDelirium(this.target, true);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }

  apply(player) {
    super.apply(player);


    this.falseModeEffect = player.giveEffect("FalseMode", Infinity);
  }

   remove() {
    let temp = this.player;
    this.falseModeEffect.remove();
    super.remove();
    temp.game.events.emit("AbilityToggle", temp);
  }

  
};
