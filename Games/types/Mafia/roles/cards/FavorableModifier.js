const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class FavorableModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    //this.startEffects = ["FavorableMode"];
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Information", "WhenDead"])) {
          if (
            this.FavorableModeEffect == null ||
            !this.player.effects.includes(this.FavorableModeEffect)
          ) {
            this.FavorableModeEffect = this.player.giveEffect(
              "FavorableMode",
              Infinity
            );
            this.passiveEffects.push(this.FavorableModeEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(
            this.FavorableModeEffect
          );
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.FavorableModeEffect != null) {
            this.FavorableModeEffect.remove();
            this.FavorableModeEffect = null;
          }
        }
      },
    };
  }
};
