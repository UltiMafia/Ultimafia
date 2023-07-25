const Card = require("../../Card");

module.exports = class AllWhispersLeak extends Card {
  constructor(role) {
    super(role);

    this.startEffects = ["Leak Whispers"];
  }
};
