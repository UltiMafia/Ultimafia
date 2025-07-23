const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class UnfavorableModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    //this.startEffects = ["UnfavorableMode"];
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Information", "WhenDead"])) {
          if (
            this.UnfavorableModeEffect == null ||
            !this.player.effects.includes(this.UnfavorableModeEffect)
          ) {
            this.UnfavorableModeEffect = this.player.giveEffect(
              "UnfavorableMode",
              Infinity
            );
            this.passiveEffects.push(this.UnfavorableModeEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(
            this.UnfavorableModeEffect
          );
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.UnfavorableModeEffect != null) {
            this.UnfavorableModeEffect.remove();
            this.UnfavorableModeEffect = null;
          }
        }
      },
    };
  }
};
