const Card = require("../../Card");

module.exports = class ConvertImmune extends Card {
  constructor(role) {
    super(role);

    //this.immunity["convert"] = 1;
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier"])) {
          if (
            this.ConvertImmuneEffect == null ||
            !this.player.effects.includes(this.ConvertImmuneEffect)
          ) {
            this.ConvertImmuneEffect = this.player.giveEffect(
              "ConvertImmune",
              1,
              Infinity
            );
            this.passiveEffects.push(this.ConvertImmuneEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.ConvertImmuneEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.ConvertImmuneEffect != null) {
            this.ConvertImmuneEffect.remove();
            this.ConvertImmuneEffect = null;
          }
        }
      },
    };
  }
};
