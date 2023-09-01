const Effect = require("../Effect");

module.exports = class KillImmune extends Effect {
  constructor(immunity, lifespan) {
    super("Kill Immune");

    this.immunity["kill"] = immunity || 1;
    this.cancelImmunity["condemn"] = immunity || 1;
    this.lifespan = lifespan ?? 1;
  }
};
