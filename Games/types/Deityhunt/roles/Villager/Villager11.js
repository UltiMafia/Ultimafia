const Role = require("../../Role");

module.exports = class Villager11 extends Role {
  constructor(player, data) {
    super("Villager11", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "DeityImmune"];
  }
};
