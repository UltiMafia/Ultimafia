const Effect = require("../Effect");

module.exports = class OrgeEffect extends Effect {
  constructor(lifespan,) {
    super("OrgeEffect");
    this.lifespan = lifespan || Infinity;
  }
};
