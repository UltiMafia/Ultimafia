const Effect = require("../Effect");

module.exports = class IncubusEffect extends Effect {
  constructor(lifespan) {
    super("IncubusEffect");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }
};
