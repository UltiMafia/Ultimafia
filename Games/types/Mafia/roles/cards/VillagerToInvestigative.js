const Card = require("../../Card");

module.exports = class VillagerToInvestigative extends Card {
  constructor(role) {
    super(role);

    let tempApp = {
      investigate: "Villager",
    };
    this.editAppearance(tempApp);
  }
};
