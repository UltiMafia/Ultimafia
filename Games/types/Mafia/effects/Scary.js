const Effect = require("../Effect");

module.exports = class Scary extends Effect {
  constructor(lifespan) {
    super("Scary");
    this.lifespan = lifespan || Infinity;
  }
};
