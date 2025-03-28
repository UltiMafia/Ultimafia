const Effect = require("../Effect");

module.exports = class VoteNegative extends Effect {
  constructor(lifespan) {
    super("VoteNegative");
    this.lifespan = lifespan || Infinity;
  }
};
