const Role = require("../../Role");

module.exports = class Villager3 extends Role {
  constructor(player, data) {
    super("Villager3", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood"];
    this.startItems = ["Villager3Sword"];
  }
};
