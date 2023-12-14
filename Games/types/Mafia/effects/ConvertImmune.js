const Effect = require("../Effect");

module.exports = class KillImmune extends Effect {
  constructor(immunity, lifespan) {
    super("Convert Immune");

    this.immunity["convert"] = immunity || 1;
    this.lifespan = lifespan ?? Infinity;
  }
};
