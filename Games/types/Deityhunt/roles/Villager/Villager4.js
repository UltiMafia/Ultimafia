const Role = require("../../Role");

module.exports = class Villager4 extends Role {
  constructor(player, data) {
    super("Villager4", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "ReviveIfTown"];
  }
};
