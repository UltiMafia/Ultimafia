const Effect = require("../Effect");

module.exports = class AssassinEffect extends Effect {
  constructor(lifespan) {
    super("AssassinEffect");
    this.lifespan = lifespan || Infinity;
  }
};
