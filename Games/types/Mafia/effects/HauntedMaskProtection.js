const Effect = require("../Effect");

module.exports = class HauntedMaskProtection extends Effect {
  constructor(immunity, lifespan) {
    super("HauntedMaskProtection");

    this.immunity["kill"] = immunity || 1;
    this.cancelImmunity["condemn"] = immunity || 1;
    this.cancelImmunity["Haunted Mask"] = immunity || 1;
    this.lifespan = lifespan ?? Infinity;
  }
};
