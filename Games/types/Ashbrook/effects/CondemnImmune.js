const Effect = require("../Effect");

module.exports = class CondemnImmune extends Effect {
  constructor(role) {
    super(role);

    this.lifespan = 1;

    this.immunity["condemn"] = 3;
  }
};
