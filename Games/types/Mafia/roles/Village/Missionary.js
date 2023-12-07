const Role = require("../../Role");

module.exports = class Missionary extends Role {
  constructor(player, data) {
    super("Missionary", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveTract"];
  }
};
