const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Blind extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Blind"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasBlindEffect) {
          return;
        }
        if (this.hasAbility(["Modifier", "Speaking"])) {
          this.giveEffect(this.player, "Blind", Infinity);
          this.hasBlindEffect = true;
        }
      },
    };
  }
};
