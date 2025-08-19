const Card = require("../../Card");

module.exports = class CondemnImmune extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["CondemnImmune"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Condemn"])) {
          if (
            this.CondemnImmuneEffect == null ||
            !this.player.effects.includes(this.CondemnImmuneEffect)
          ) {
            this.CondemnImmuneEffect = this.player.giveEffect(
              "CondemnImmune",
              Infinity
            );
            this.passiveEffects.push(this.CondemnImmuneEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.CondemnImmuneEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.CondemnImmuneEffect != null) {
            this.CondemnImmuneEffect.remove();
            this.CondemnImmuneEffect = null;
          }
        }
      },
    };
  }
};
