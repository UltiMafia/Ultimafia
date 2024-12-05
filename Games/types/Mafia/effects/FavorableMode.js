const Effect = require("../Effect");

module.exports = class FavorableMode extends Effect {
  constructor(lifespan) {
    super("FavorableMode");
    this.lifespan = lifespan || Infinity;
  }
};
