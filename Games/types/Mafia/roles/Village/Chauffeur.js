const Role = require("../../Role");

module.exports = class Chauffeur extends Role {
  constructor(player, data) {
    super("Chauffeur", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SwapVisitors"];
  }
};
