const Role = require("../../Role");

module.exports = class Quartermaster extends Role {
  constructor(player, data) {
    super("Quartermaster", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveRifle"];
  }
};
