const Effect = require("../Effect");

module.exports = class Marked extends Effect {
  constructor(lifespan, role) {
    super("Marked");
    this.lifespan = lifespan || Infinity;
    this.SourceRole = role || [];
    this.isMalicious = true;
  }
};
