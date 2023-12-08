const Card = require("../../Card");

module.exports = class StartWithTract extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Tract"];
  }
};
