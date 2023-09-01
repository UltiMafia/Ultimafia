const Role = require("../../Role");

module.exports = class MindReader extends Role {
  constructor(player, data) {
    super("Mind Reader", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "NeighborAlignment"];
  }
};
