const Card = require("../../Card");

module.exports = class StartWithSheild extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Sheild"];
  }
};
