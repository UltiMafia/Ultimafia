const Card = require("../../Card");

module.exports = class AppearAsVillagerOnDeath extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      self: "real",
      reveal: "real",
      lynch: "Villager",
      death: "Villager",
      investigate: "real",
    };
  }
};
