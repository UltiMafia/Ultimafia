const Card = require("../../Card");

module.exports = class StartWithHeldBomb extends Card {
  constructor(role) {
    super(role);

    this.startItems = [{ type: "Bomb", args: [{ cannotBeStolen: true }] }];
  }
};
