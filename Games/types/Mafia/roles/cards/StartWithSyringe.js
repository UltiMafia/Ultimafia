const Card = require("../../Card");

module.exports = class StartWithSyringe extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Syringe"];
  }
};
