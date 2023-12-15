const Card = require("../../Card");

module.exports = class AppearAsFliplessOnDeath extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      condemn: null,
      death: null,
    };
  }
};
