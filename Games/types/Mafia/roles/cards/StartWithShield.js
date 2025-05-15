const Card = require("../../Card");

module.exports = class StartWithShield extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Shield"];
  }
};
