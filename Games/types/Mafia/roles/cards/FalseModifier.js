const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_EFFECT_REMOVER_DEFAULT } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class FalseModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    //this.startEffects = ["FalseMode"];
    this.listeners = {
        state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_REMOVER_DEFAULT,
          labels: ["abolute", "hidden"],
          run: function () {

            for (let effect of this.actor.effects){
              if(effect.name == "Insanity"){
                effect.remove();
              }
            }
              
          },
        });

        this.game.queueAction(action);
      },
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Information", "WhenDead"])) {
          if (
            this.FalseModeEffect == null ||
            !this.player.effects.includes(this.FalseModeEffect)
          ) {
            this.FalseModeEffect = this.player.giveEffect(
              "FalseMode",
              Infinity
            );
            this.passiveEffects.push(this.FalseModeEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.FalseModeEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.FalseModeEffect != null) {
            this.FalseModeEffect.remove();
            this.FalseModeEffect = null;
          }
        }
      },
    };
  }
};
