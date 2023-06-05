const Role = require("../../Role");

module.exports = class Sapling extends Role {
  constructor(player, data) {
    super("Sapling", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "TurnIntoTree"];
  }
};
