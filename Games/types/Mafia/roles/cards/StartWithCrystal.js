const Card = require("../../Card");

module.exports = class StartWithCrystal extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Crystal"];
  }
};
