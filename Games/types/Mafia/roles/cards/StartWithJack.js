const Card = require("../../Card");

module.exports = class StartWithJack extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["JackInTheBox"];
  }
};
