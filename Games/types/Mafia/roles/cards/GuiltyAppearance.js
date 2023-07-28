const Card = require("../../Card");

module.exports = class GuiltyAppearance extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      reveal: "real",
      condemn: "Mafioso",
      death: "real",
      investigate: "Mafioso",
    };
  }
};
