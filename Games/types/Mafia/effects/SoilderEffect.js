const Effect = require("../Effect");

module.exports = class SoilderEffect extends Effect {
  constructor(lifespan) {
    super("SoilderEffect");
    this.lifespan = lifespan || Infinity;
  }
};
