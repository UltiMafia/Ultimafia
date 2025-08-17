const Effect = require("../Effect");

module.exports = class DevoteeEffect extends Effect {
  constructor(lifespan) {
    super("DevoteeEffect");
    this.lifespan = lifespan || Infinity;
  }
};
