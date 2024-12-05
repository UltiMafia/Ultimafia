const Effect = require("../Effect");

module.exports = class UnfavorableMode extends Effect {
  constructor(lifespan) {
    super("UnfavorableMode");
    this.lifespan = lifespan || Infinity;
  }
};
