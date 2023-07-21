const Role = require("../../Role");

module.exports = class Villager13 extends Role {
  constructor(player, data) {
    super("Villager13", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "ExorciseDeity"];
  }
};
