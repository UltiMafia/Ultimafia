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
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Win-Con"])) {
          this.role.data.DevotionCult = true;
          if (this.role.name == "Devotee" && this.game.alivePlayers().length >= 5) {
            this.role.data.BackUpConvert = true;
          }
          else{
            this.role.data.BackUpConvert = false;
            this.role.data.DevotionCult = false;
          }
          
        } else {
          this.role.data.BackUpConvert = false;
          this.role.data.DevotionCult = false;
        }
      },
    };


    
  }
};
