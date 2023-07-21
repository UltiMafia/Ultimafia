const Effect = require("../Effect");

module.exports = class CondemnImmune extends Effect {
  constructor(power, lifespan) {
    super("Condemn Immune");

    this.lifespan = lifespan ?? Infinity;
    this.immunity.condemn = power || 3;
  }
};