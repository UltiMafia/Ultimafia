const Card = require("../../Card");

module.exports = class FamineImmune extends Card {
  constructor(role) {
    super(role);

    this.immunity["famine"] = 1;
  }
};
