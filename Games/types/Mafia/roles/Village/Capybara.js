const Role = require("../../Role");

module.exports = class Capybara extends Role {
  constructor(player, data) {
    super("Capybara", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveOrange"];
  }
};
