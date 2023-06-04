const Card = require("../../Card");

module.exports = class StartWithBomb extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Bomb"];
  }
};
