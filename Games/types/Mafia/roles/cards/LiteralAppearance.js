const Card = require("../../Card");

module.exports = class LiteralAppearance extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "WhenDead"])) {
          if (
            this.LiteralEffect == null ||
            !this.player.effects.includes(this.LiteralEffect)
          ) {
            this.LiteralEffect = this.player.giveEffect(
              "Misregistration",
              Infinity
            );
            this.passiveEffects.push(this.LiteralEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.LiteralEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.LiteralEffect != null) {
            this.LiteralEffect.remove();
            this.LiteralEffect = null;
          }
        }
      },
    };
  }
};
