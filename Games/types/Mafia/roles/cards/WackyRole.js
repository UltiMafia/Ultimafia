const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class WackyRole extends Card {
  constructor(role) {
    super(role);
    this.role.data.wackyModifier = true;
  }
};
