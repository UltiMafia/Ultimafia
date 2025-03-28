const Effect = require("../Effect");

module.exports = class VoteDecrease extends Effect {
  constructor(lifespan, Amount) {
    super("VoteDecrease");
    this.lifespan = lifespan || Infinity;
    this.Amount = Amount;
  }
};
