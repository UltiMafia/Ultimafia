const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class CanSeeDeadChat extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "WhenDead"])) {
          if (
            (this.SeeingDeadEffect == null ||
            !this.player.effects.includes((this.SeeingDeadEffect)))
          ) {
            this.SeeingDeadEffect = this.player.giveEffect(
              "CanSeeDead",
              Infinity
            );
            this.passiveEffects.push(this.SeeingDeadEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.SeeingDeadEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.SeeingDeadEffect != null) {
           this.SeeingDeadEffect.remove();
            this.SeeingDeadEffect = null;
          }
        }
      },
    };
  }
};
