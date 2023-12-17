const Effect = require("../Effect");

module.exports = class Gasoline extends Effect {
  constructor(lifespan) {
    super("Gasoline");
    this.lifespan = lifespan || Infinity;
  }
};
