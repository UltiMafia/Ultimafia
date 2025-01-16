const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class FalseModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
    };

    this.startEffects = ["FalseMode"];
  }
};
