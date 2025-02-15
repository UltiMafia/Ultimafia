const Effect = require("../Effect");

module.exports = class Braggadocious extends Effect {
  constructor(lifespan) {
    super("Braggadocious");
    this.lifespan = Infinity;
  }
};
