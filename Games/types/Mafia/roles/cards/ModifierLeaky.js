const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ModifierLeaky extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Speaking", "Whispers"])) {
          if (
            this.LeakyEffect == null ||
            !this.player.effects.includes(this.LeakyEffect)
          ) {
            this.LeakyEffect = this.player.giveEffect("LeakWhispers", Infinity);
            this.passiveEffects.push(this.LeakyEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.LeakyEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.LeakyEffect != null) {
            this.LeakyEffect.remove();
            this.LeakyEffect = null;
          }
        }
      },
    };
  }
};
