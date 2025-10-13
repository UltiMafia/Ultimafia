const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnRealWord extends Card {
  constructor(role) {
    super(role);
    this.role.GhostWordLearnForce = "Real";
  }
};
