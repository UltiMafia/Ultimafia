const Effect = require("../Effect");

module.exports = class Voteless extends Effect {
  constructor(lifespan) {
    super("Voteless");
    this.lifespan = lifespan || Infinity;
  }
};
