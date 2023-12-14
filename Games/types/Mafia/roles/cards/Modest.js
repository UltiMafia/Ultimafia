const Card = require("../../Card");

module.exports = class Modest extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
    };
  }
};
