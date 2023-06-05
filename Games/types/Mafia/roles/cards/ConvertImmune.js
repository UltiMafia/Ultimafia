const Card = require("../../Card");

module.exports = class ConvertImmune extends Card {
  constructor(role) {
    super(role);

    this.immunity.convert = 1;
  }
};
