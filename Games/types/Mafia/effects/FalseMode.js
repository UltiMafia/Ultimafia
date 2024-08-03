const Effect = require("../Effect");

module.exports = class Probe extends Effect {
  constructor(lifespan) {
    super("FalseMode");
    this.lifespan = lifespan || Infinity;
  }
};
