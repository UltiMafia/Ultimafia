const Effect = require("../Effect");

module.exports = class FalseMode extends Effect {
  constructor(lifespan) {
    super("FalseMode");
    this.lifespan = lifespan || Infinity;
  }
};
