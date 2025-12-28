const Effect = require("../Effect");

module.exports = class Misregistration extends Effect {
  constructor(lifespan) {
    super("Misregistration");
    this.lifespan = lifespan || Infinity;
  }
};
