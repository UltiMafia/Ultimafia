const Effect = require("../Effect");

module.exports = class Insanity extends Effect {
  constructor(lifespan) {
    super("Insanity");
    this.lifespan = lifespan || Infinity;
  }
};
