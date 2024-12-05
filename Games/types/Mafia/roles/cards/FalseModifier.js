const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class FalseModifier extends Card {
  constructor(role) {
    super(role);

    this.startEffects = ["FalseMode"];
  }
};
