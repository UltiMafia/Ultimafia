const Role = require("../../Role");

module.exports = class Playwright extends Role {
  constructor(player, data) {
    super("Playwright", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore"];
  }
};
