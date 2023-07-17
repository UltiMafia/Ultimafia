const Card = require("../../Card");

module.exports = class CondemnImmune extends Card {
  constructor(role) {
    super(role);

    this.immunity.condemn = 3;
  }
};
