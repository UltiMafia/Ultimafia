const Card = require("../../Card");

module.exports = class Clueless extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
    };
  }
};
