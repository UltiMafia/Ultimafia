const Card = require("../../Card");

module.exports = class StartWithKnife extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Crystal"];
  }
};
