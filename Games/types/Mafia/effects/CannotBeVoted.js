const Effect = require("../Effect");

module.exports = class CannotBeVoted extends Effect {
  constructor(lifespan) {
    super("CannotBeVoted");
    this.lifespan = lifespan || Infinity;
  }
};
