const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Clueless extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Scrambled"];

    this.hideModifier = {
      self: true,
    };

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Speaking"])) {
          if (
            this.CluelessEffect == null ||
            !this.players.effects.includes(this.CluelessEffect)
          ) {
            this.CluelessEffect = this.player.giveEffect("Scrambled", Infinity);
            this.passiveEffects.push(this.CluelessEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.CluelessEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.CluelessEffect != null) {
            this.CluelessEffect.remove();
            this.CluelessEffect = null;
          }
        }
      },
    };
  }
};
