const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class UnfavorableModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    this.startEffects = ["UnfavorableMode"];
  }
};
