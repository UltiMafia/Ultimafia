const Effect = require("../Effect");

module.exports = class DevotionEffect extends Effect {
  constructor(lifespan) {
    super("DevotionEffect");
    this.lifespan = lifespan || Infinity;
  }
};
