const Effect = require("../Effect");

module.exports = class SaveImmune extends Effect {
  constructor(immunity, lifespan) {
    super("Save Immune");

    this.immunity["save"] = immunity || 1;
    this.cancelImmunity["kill"] = immunity || 1;
    this.lifespan = lifespan ?? Infinity;
  }
};
