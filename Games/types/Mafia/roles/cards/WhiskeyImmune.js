const Card = require("../../Card");

module.exports = class WhiskeyImmune extends Card {
  constructor(role) {
    super(role);

    this.immunity.sedate = 1;
  }
};
