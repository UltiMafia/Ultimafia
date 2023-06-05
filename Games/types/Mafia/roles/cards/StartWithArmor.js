const Card = require("../../Card");

module.exports = class StartWithArmor extends Card {
  constructor(role) {
    super(role);

    this.startItems = ["Armor"];
  }
};
