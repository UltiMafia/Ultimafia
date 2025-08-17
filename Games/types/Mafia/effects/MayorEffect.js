const Effect = require("../Effect");

module.exports = class MayorEffect extends Effect {
  constructor(lifespan) {
    super("MayorEffect");
    this.lifespan = lifespan || Infinity;
  }
};
