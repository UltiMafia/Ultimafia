const Role = require("../../Role");

module.exports = class Martyr extends Role {
  constructor(player, data) {
    super("Martyr", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SacrificeSelf"];
  }
};
