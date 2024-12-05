const Effect = require("../Effect");

module.exports = class TrueMode extends Effect {
  constructor(lifespan) {
    super("TrueMode");
    this.lifespan = lifespan || Infinity;
  }
};
