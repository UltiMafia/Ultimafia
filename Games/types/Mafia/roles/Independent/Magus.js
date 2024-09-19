const Role = require("../../Role");

module.exports = class Magus extends Role {
  constructor(player, data) {
    super("Magus", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "WinIfVillageWon",
      "RemoveEvilRoles",
      "MagusGame",
    ];
  }
};
