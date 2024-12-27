const Effect = require("../Effect");

module.exports = class FakeVisit extends Effect {
  constructor(lifespan, info) {
    super("FakeVisit");
    this.lifespan = lifespan || Infinity;
    this.Visits = info;
  }
};
