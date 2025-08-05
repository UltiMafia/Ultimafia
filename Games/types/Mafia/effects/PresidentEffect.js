const Effect = require("../Effect");

module.exports = class PresidentEffect extends Effect {
  constructor(lifespan) {
    super("PresidentEffect");
    this.lifespan = lifespan || Infinity;
  }
};
