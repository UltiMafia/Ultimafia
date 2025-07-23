const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class Immortal extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_SAVER,
        labels: ["save"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          this.actor.giveEffect("Immortal", 5, 1);
        },
      },
    ];
*/
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "OnlyWhenAlive"])) {
          if (
            this.ImmortalEffect == null ||
            !this.player.effects.includes(this.ImmortalEffect)
          ) {
            this.ImmortalEffect = this.player.giveEffect(
              "Immortal",
              5,
              Infinity
            );
            this.passiveEffects.push(this.ImmortalEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.ImmortalEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.ImmortalEffect != null) {
            this.ImmortalEffect.remove();
            this.ImmortalEffect = null;
          }
        }
      },
    };
  }
};
