const Card = require("../../Card");

module.exports = class FullMoonInvincible extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      stateEvents: function (stateEvents) {
        if (stateEvents["Full Moon"] == true) {
          if (!this.hasAbility(["OnlyWhenAlive"])) {
            return;
          }
          //this.player.setTempImmunity("kill", 1);
          this.player.queueAlert(":invincible: You are invincible tonight.");
        }
      },
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (
          this.hasAbility(["OnlyWhenAlive"]) &&
          (this.game.getStateName() == "Night" ||
            this.game.getStateName() == "Dawn") &&
          this.game.stateEvents["Full Moon"] == true
        ) {
          if (
            this.FullMoonImmortalEffect == null ||
            !this.player.effects.includes(this.FullMoonImmortalEffect)
          ) {
            this.FullMoonImmortalEffect = this.player.giveEffect(
              "Immortal",
              5,
              Infinity
            );
            this.passiveEffects.push(this.FullMoonImmortalEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(
            this.FullMoonImmortalEffect
          );
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.FullMoonImmortalEffect != null) {
            this.FullMoonImmortalEffect.remove();
            this.FullMoonImmortalEffect = null;
          }
        }
      },
    };
  }
};
