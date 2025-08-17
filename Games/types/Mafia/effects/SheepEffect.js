const Effect = require("../Effect");

module.exports = class SheepEffect extends Effect {
  constructor(lifespan) {
    super("SheepEffect");
    this.lifespan = lifespan || Infinity;
  }
};
