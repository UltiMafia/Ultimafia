const Role = require("../../Role");

module.exports = class Villager1 extends Role {
  constructor(player, data) {
    super("Villager1", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "NeighborAlignment"];
  }
};
