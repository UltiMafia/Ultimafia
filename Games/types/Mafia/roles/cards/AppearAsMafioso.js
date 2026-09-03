const Card = require("../../Card");

module.exports = class AppearAsMafioso extends Card {
  constructor(role) {
    super(role);

    this.editAppearance({
      self: "Villager",
      investigate: "Mafioso",
      condemn: "Mafioso",
      reveal: "Mafioso",
    });

    this.hideModifier = {
      self: true,
      investigate: true,
      condemn: true,
      reveal: true,
    };
  }
};
