const Role = require("../../Role");

module.exports = class Resurrectionist extends Role {
  constructor(player, data) {
    super("Resurrectionist", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "ReviveIfTown"];
  }
};
