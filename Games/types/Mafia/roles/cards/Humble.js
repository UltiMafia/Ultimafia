const Card = require("../../Card");

module.exports = class Humble extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      self: "Villager",
    };
    this.hideModifier = {
      self: true,
    };
  }
};
