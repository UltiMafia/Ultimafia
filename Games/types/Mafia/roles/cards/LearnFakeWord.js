const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnFakeWord extends Card {
  constructor(role) {
    super(role);
    this.role.GhostWordLearnForce = "Fake";
  }
};
