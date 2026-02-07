const Card = require("../../Card");

module.exports = class StartWithTNT extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["TNT"];
  }
};
