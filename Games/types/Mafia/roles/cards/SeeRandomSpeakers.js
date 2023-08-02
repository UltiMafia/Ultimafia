const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class SeeRandomSpeakers extends Card {
  constructor(role) {
    super(role);
    
    this.startEffects = ["Scrambled"];
  }
};
