const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class TrueModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    //this.startEffects = ["TrueMode"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Information", "WhenDead"])) {
          if (
            this.TrueModeEffect == null ||
            !this.players.effects.includes(this.TrueModeEffect)
          ) {
            this.TrueModeEffect = this.player.giveEffect("TrueMode", Infinity);
            this.player.passiveEffects.push(this.TrueModeEffect);
          }
        } else {
          var index = this.player.passiveEffects.indexOf(this.TrueModeEffect);
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
          }
          if (this.TrueModeEffect != null) {
            this.TrueModeEffect.remove();
            this.TrueModeEffect = null;
          }
        }
      },
    };
  }
};
