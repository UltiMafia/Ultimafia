const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Blind extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Blind"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Speaking"])) {
          if (
            this.BlindEffect == null ||
            !this.player.effects.includes(this.BlindEffect)
          ) {
            this.BlindEffect = this.player.giveEffect("Blind", Infinity);
            this.passiveEffects.push(this.BlindEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.BlindEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.BlindEffect != null) {
            this.BlindEffect.remove();
            this.BlindEffect = null;
          }
        }
      },
    };
  }
};
