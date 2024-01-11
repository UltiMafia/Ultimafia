const Card = require("../../Card");

module.exports = class AppearAsVillagerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      condemn: "Villager",
      death: "Villager",
    };

    this.hideModifier = {
      condemn: true,
      death: true,
    };
  }
};
