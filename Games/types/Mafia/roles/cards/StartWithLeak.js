const Card = require("../../Card");

module.exports = class StartWithLeak extends Card {
  constructor(role) {
    super(role);

    this.startEffects = ["Leak Whispers"];
  }
};
