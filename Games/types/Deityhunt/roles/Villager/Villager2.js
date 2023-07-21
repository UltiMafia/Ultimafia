const Role = require("../../Role");

module.exports = class Villager2 extends Role {
  constructor(player, data) {
    super("Villager2", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "DeityProtector"];
  }
};
