const Role = require("../../Role");

module.exports = class Chainsmoker extends Role {
  constructor(player, data) {
    super("Chainsmoker", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood"];
  }
};
