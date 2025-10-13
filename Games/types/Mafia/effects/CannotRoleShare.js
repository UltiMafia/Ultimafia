const Effect = require("../Effect");

module.exports = class CannotRoleShare extends Effect {
  constructor(lifespan) {
    super("CannotRoleShare");
    this.lifespan = lifespan || Infinity;
    this.isMalicious = true;
  }
};
