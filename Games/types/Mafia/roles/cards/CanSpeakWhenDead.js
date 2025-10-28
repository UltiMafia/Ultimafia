const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class CanSpeakWhenDead extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "WhenDead"])) {
          if (
            (this.SpeakingDeadEffect == null ||
            !this.player.effects.includes((this.SpeakingDeadEffect)))
          ) {
            this.SpeakingDeadEffect = this.player.giveEffect(
              "CanSpeakToLiving",
              Infinity
            );
            this.passiveEffects.push(this.SpeakingDeadEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.SpeakingDeadEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.SpeakingDeadEffect != null) {
           this.SpeakingDeadEffect.remove();
            this.SpeakingDeadEffect = null;
          }
        }
      },
    };
  }
};
