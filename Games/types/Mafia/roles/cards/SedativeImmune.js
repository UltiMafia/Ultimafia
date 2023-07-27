const Card = require("../../Card");

module.exports = class SedativeImmune extends Card {
  constructor(role) {
    super(role);

    this.immunity.sedate = 1;
  }
};
