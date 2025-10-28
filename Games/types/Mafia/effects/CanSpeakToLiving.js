const Effect = require("../Effect");

module.exports = class CanSpeakToLiving extends Effect {
  constructor(lifespan) {
    super("CanSpeakToLiving");
    this.lifespan = lifespan || Infinity;
  }
};
