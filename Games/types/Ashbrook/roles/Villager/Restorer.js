const Role = require("../../Role");

module.exports = class Restorer extends Role {
  constructor(player, data) {
    super("Restorer", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "FinalThreeNoCondemnWin"];
  }
};
