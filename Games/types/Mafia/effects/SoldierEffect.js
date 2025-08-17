const Effect = require("../Effect");

module.exports = class SoldierEffect extends Effect {
  constructor(lifespan) {
    super("SoldierEffect");
    this.lifespan = lifespan || Infinity;
  }
};
