const Card = require("../../Card");

module.exports = class StartWithIceCream extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["IceCream"];
  }
};
