const Card = require("../../Card");

module.exports = class VillagerToInvestigative extends Card {
  constructor(role) {
    super(role);

    let tempApp = {
      investigate: "Villager",
    };
    this.hideModifier = {
      investigate: true,
    };
    this.editAppearance(tempApp);
  }
};
