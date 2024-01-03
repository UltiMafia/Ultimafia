const Card = require("../../Card");

module.exports = class StartWithWager extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Wager"];
  }
};
