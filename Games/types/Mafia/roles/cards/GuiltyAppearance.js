const Card = require("../../Card");

module.exports = class GuiltyAppearance extends Card {
  constructor(role) {
    super(role);

    const selfAppearance = role.name == "Miller" ? "Villager" : "real";

    this.appearance = {
      self: selfAppearance,
      reveal: "real",
      condemn: "Mafioso",
      death: "real",
      investigate: "Mafioso",
    };

    this.hideModifier = {
      condemn: true,
      investigate: true,
    };
  }
};
