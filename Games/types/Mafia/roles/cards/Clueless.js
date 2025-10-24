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
        if(this.hasCluelessEffect){
          return;
        }
        if (this.hasAbility(["Modifier", "Speaking"])) {
          this.giveEffect(this.player, "Scrambled", Infinity);
          this.hasCluelessEffect = true;
        
        } 
      },
    };
  }
};
