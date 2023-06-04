const Card = require("../../Card");

module.exports = class Oblivious extends Card {
  constructor(role) {
    super(role);

    this.oblivious = {
      self: true,
      Spies: true,
    };
  }
};
