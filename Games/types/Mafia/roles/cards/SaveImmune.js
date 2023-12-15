const Card = require("../../Card");

module.exports = class SaveImmune extends Card {
  constructor(role) {
    super(role);

    this.startEffects = ["SaveImmune"];
  }
};
