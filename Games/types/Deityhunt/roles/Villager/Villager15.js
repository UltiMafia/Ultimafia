const Role = require("../../Role");

module.exports = class Villager15 extends Role {
  constructor(player, data) {
    super("Villager15", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnTwoNonDeity"];
  }
};
