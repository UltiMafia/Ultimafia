const Role = require("../../Role");

module.exports = class Trapper extends Role {
  constructor(player, data) {
    super("Trapper", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "TrapLeader"];
  }
};
