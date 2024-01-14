const Card = require("../../Card");

module.exports = class StartWithRifle extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Rifle"];
  }
};
