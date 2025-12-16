const Card = require("../../Card");

module.exports = class StartWithCrystalBall extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Crystal Ball"];
  }
};
