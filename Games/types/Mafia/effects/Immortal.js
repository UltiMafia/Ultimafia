const Effect = require("../Effect");

module.exports = class Immortal extends Effect {
  constructor(immunity, lifespan) {
    super("Immortal");

    this.immunity["kill"] = immunity || 5;
    this.immunity["lynch"] = immunity || 5;

    this.lifespan = lifespan ?? 1;
  }
};
