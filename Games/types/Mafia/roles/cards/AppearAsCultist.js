const Card = require("../../Card");

module.exports = class AppearAsCultist extends Card {
  constructor(role) {
    super(role);

    const selfAppearance = role.name == "Occultist" ? "Villager" : "real";

    this.appearance = {
      self: selfAppearance,
      reveal: "real",
      condemn: "Cultist",
      death: "real",
      investigate: "Cultist",
    };

    this.hideModifier = {
      condemn: true,
      investigate: true,
    };
  }
};
