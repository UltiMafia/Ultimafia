const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Clueless extends Card {
  constructor(role) {
    super(role);
    
    this.startEffects = ["Scrambled"];

    this.hideModifier = {
      self: true,
    }
  }
};
