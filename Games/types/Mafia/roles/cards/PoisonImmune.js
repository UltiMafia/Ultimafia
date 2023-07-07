const Card = require("../../Card");

module.exports = class PoisonImmune extends Card {
  constructor(role) {
    super(role);

    this.immunity.poison = 1;
  }
};
