const Card = require("../../Card");

module.exports = class AppearAsCleanedOnDeath extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      condemn: null,
      death: null,
    };
  }
};
