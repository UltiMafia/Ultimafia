const Effect = require("../Effect");

module.exports = class TelevangelistEffect extends Effect {
  constructor(lifespan) {
    super("TelevangelistEffect");
    this.lifespan = lifespan || Infinity;
  }
};
