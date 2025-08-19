const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Devotion extends Card {
  constructor(role) {
    super(role);
    /*
    this.role.data.DevotionCult = true;
    if (this.role.name == "Devotee") {
      this.role.data.BackUpConvert = true;
    }
*/

    this.listeners = {
      state: function (stateInfo) {
        this.game.events.emit("AbilityToggle", this.player);
      },
      /*
      AbilityToggle: function (player) {
        if (this.player.role.hasAbility(["Win-Con"])) {
          //this.game.queueAlert(`${this.game.alivePlayers().length} players are alive`);
          this.player.role.data.DevotionCult = true;
          if (this.name == "Devotee") {
            if(this.game.alivePlayers().length >= 5){
              this.player.role.data.BackUpConvert = true;
            }
            else{
              this.player.role.data.DevotionCult = false;
              this.player.role.data.BackUpConvert = false;
            }
          }
          
        } else {
          this.player.role.data.BackUpConvert = false;
          this.player.role.data.DevotionCult = false;
        }
      },
      */
      AbilityToggle: function (player) {
        if (!this.player.alive) {
          return;
        }
        let checks = true;
        if (!this.hasAbility(["Win-Con"])) {
          checks = false;
        }

        if (checks == true) {
          if (
            this.DevotionEffect == null ||
            !this.player.effects.includes(this.DevotionEffect)
          ) {
            this.DevotionEffect = this.player.giveEffect(
              "DevotionEffect",
              Infinity
            );
            this.passiveEffects.push(this.DevotionEffect);
          }
          if (this.name == "Devotee") {
            if (
              this.DevoteeEffect == null ||
              !this.player.effects.includes(this.DevoteeEffect)
            ) {
              this.DevoteeEffect = this.player.giveEffect(
                "DevoteeEffect",
                Infinity
              );
              this.passiveEffects.push(this.DevoteeEffect);
            }
          }
        } else {
          var index = this.passiveEffects.indexOf(this.DevotionEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.DevotionEffect != null) {
            this.DevotionEffect.remove();
            this.DevotionEffect = null;
          }

          var index2 = this.passiveEffects.indexOf(this.DevoteeEffect);
          if (index2 != -1) {
            this.passiveEffects.splice(index2, 1);
          }
          if (this.DevoteeEffect != null) {
            this.DevoteeEffect.remove();
            this.DevoteeEffect = null;
          }
        }
      },
    };
  }
};
