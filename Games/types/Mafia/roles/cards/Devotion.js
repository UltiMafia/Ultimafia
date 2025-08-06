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
    };


    
  }
};
