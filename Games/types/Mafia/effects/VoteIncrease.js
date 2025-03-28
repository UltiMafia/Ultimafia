const Effect = require("../Effect");

module.exports = class VoteIncrease extends Effect {
  constructor(lifespan, Amount) {
    super("VoteIncrease");
    this.lifespan = lifespan || Infinity;
    this.Amount = Amount;
  }
};
