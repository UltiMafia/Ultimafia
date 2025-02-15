const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class FavorableModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
    };

    this.startEffects = ["FavorableMode"];
  }
};
