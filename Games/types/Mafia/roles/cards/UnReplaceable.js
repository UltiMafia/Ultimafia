const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class UnReplaceable extends Card {
  constructor(role) {
    super(role);
    this.role.data.UnReplaceable = true;
    this.role.data.reroll = true;
  }
};
