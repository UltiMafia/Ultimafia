const Role = require("../../Role");

module.exports = class Villager12 extends Role {
  constructor(player, data) {
    super("Villager12", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnCondemnedRoles"];
  }
};
