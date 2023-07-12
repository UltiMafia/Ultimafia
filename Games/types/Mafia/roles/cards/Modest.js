const Card = require("../../Card");

module.exports = class Modest extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      reveal: true,
    };

    var appearance;
    if (this.role.alignment === "Village" || this.role.winCount === "Village") {
      appearance = "Villager";
    } else if (this.role.alignment === "Mafia") {
      appearance = "Mafioso";
    } else if (this.role.alignment === "Cult") {
      appearance = "Cultist";
    } else if (this.role.alignment === "Independent") {
      appearance = "Grouch";
    }

    if (!appearance) {
      return;
    }

    this.appearance = {
      self: appearance,
      reveal: appearance,
    };
  }
};
