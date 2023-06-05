const Card = require("../../Card");

module.exports = class StartWithGun extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Gun"];
  }
};
