const Effect = require("../Effect");

module.exports = class CannotRespond extends Effect {
  constructor() {
    super("CannotRespond");
    this.lifespan = 1;
  }
};
