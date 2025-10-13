const Effect = require("../Effect");

module.exports = class MustRoleShare extends Effect {
  constructor(lifespan) {
    super("MustRoleShare");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }
};
