const Effect = require("../Effect");

module.exports = class Probe extends Effect {
  constructor(lifespan) {
    super("Probe");
    this.lifespan = lifespan || Infinity;
  }
};
