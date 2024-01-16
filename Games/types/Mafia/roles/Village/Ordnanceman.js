const Role = require("../../Role");

module.exports = class Ordnanceman extends Role {
  constructor(player, data) {
    super("Ordnanceman", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveRifle"];
  }
};
