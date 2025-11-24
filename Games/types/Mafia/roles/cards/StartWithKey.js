const Card = require("../../Card");

module.exports = class StartWithKey extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Key"];
  }
};
