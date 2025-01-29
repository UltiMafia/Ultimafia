const Effect = require("../Effect");

module.exports = class FalseMode extends Effect {
  constructor(lifespan) {
    super("Unveggable");
    this.lifespan = lifespan || Infinity;
  }
};
