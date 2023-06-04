const Role = require("../../Role");

module.exports = class Enchantress extends Role {
  constructor(player, data) {
    super("Enchantress", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveCrystal"];
  }
};
