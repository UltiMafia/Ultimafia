const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Devotion extends Card {
  constructor(role) {
    super(role);
    this.role.data.DevotionCult = true;
    if(this.player.role.name == "Devotee"){
      this.role.data.BackUpConvert = true;
    }
  }
};
