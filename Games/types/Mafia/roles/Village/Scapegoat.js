const Role = require("../../Role");

module.exports = class Scapegoat extends Role {
  constructor(player, data) {
    super("Scapegoat", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "FrustratedCondemnation",
      "Humble",
    ];
  }
};
