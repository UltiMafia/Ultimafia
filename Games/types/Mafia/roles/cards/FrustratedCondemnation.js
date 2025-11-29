const Card = require("../../Card");
const Action = require("../../../../core/Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class FrustratedCondemnation extends Card {
  constructor(role) {
    super(role);


    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier"])) {
          if (
            this.FrustratedEffect == null ||
            !this.player.effects.includes(this.FrustratedEffect)
          ) {
            this.FrustratedEffect = this.player.giveEffect(
              "Frustrated",
              Infinity
            );
            this.passiveEffects.push(this.FrustratedEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.FrustratedEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.FrustratedEffect != null) {
            this.FrustratedEffect.remove();
            this.FrustratedEffect = null;
          }
        }
      },
    };
  }
};
