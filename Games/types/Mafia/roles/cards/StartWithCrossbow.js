const Card = require("../../Card");

module.exports = class StartWithCrossbow extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Crossbow"];
  }
};
