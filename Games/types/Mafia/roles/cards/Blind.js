const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Blind extends Card {
  constructor(role) {
    super(role);
    
    this.startEffects = ["Blind"];

  }
};
