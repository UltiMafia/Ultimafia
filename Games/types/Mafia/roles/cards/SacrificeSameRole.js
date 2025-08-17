const Card = require("../../Card");

module.exports = class SacrificeSameRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player != this.player) {
          return;
        }
        if (!this.hasAbility(["Kill", "WhenDead"])) {
          return;
        }

        for (const player of this.game.players) {
          if (
            player.alive &&
            player.hasEffect("SheepEffect")
          ) {
            player.kill("sheep", this.player, instant);
          }
        }
      },
      AbilityToggle: function (player) {
        if(!this.player.alive){
        return;
        }
        let checks = true;
        if(!this.hasAbility(["Win-Con", "WhenDead"])){
          checks = false;
        }
        
        
        if (checks == true) {
          if (
            this.SheepEffect == null ||
            !this.player.effects.includes(this.SheepEffect)
          ) {
            this.SheepEffect = this.player.giveEffect("SheepEffect", Infinity);
            this.passiveEffects.push(this.SheepEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.SheepEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.SheepEffect != null) {
            this.SheepEffect.remove();
            this.SheepEffect = null;
          }
        }
      },
    };
  }
};
