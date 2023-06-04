const Role = require("../../Role");

module.exports = class Gunsmith extends Role {
  constructor(player, data) {
    super("Gunsmith", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GunGiver"];
  }
};
