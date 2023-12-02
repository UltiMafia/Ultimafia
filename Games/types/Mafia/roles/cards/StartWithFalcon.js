const Card = require("../../Card");

module.exports = class StartWithFalcon extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Falcon"];
  }
};
