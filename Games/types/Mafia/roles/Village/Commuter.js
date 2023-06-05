const Role = require("../../Role");

module.exports = class Commuter extends Role {
  constructor(player, data) {
    super("Commuter", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BlockVisitors"];
  }
};
