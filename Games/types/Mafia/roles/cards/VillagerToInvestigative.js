const Card = require("../../Card");

module.exports = class VillagerToInvestigative extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      investigate: "Villager",
    };
  }
};
