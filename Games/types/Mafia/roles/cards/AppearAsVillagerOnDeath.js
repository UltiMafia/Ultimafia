const Card = require("../../Card");

module.exports = class AppearAsVillagerOnDeath extends Card {
  constructor(role) {
    super(role);

    let tempApp = {
      condemn: "Villager",
      death: "Villager",
    };
    this.editAppearance(tempApp);

    this.hideModifier = {
      condemn: true,
      death: true,
    };
  }
};
