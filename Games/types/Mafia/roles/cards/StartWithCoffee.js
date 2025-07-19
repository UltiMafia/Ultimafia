const Card = require("../../Card");

module.exports = class StartWithCoffee extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Coffee"];
  }
};
