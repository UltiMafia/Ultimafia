const Role = require("../../Role");

module.exports = class Martyr extends Role {
  constructor(player, data) {
    super("Martyr", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "SacrificeSelf"];
  }
};
