const Effect = require("../Effect");

module.exports = class SenatorEffect extends Effect {
  constructor(lifespan) {
    super("SenatorEffect");
    this.lifespan = lifespan || Infinity;
  }
};
