const Effect = require("../../core/Effect");

module.exports = class MafiaEffect extends Effect {
  constructor(name, data) {
    super(name, data);
    this.source = "None";
  }

  age() {
    if (
      this.game &&
      this.game.getStateName() != "Day" &&
      this.game.getStateName() != "Night"
    ) {
    } else {
      this.lifespan--;
    }

    if (this.lifespan < 0) this.remove();
  }
};
