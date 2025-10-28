const Effect = require("../Effect");

module.exports = class CanSeeDead extends Effect {
  constructor(lifespan) {
    super("CanSeeDead");
    this.lifespan = lifespan || Infinity;
  }
};
