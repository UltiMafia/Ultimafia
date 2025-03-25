const Effect = require("../Effect");

module.exports = class FalseMode extends Effect {
  constructor(lifespan) {
    super("Unveggable");
    this.lifespan = lifespan || Infinity;

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)) {
          this.remove();
        }
      },
    }
  }
};
