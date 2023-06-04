const Role = require("../../Role");

module.exports = class Tinkerer extends Role {
  constructor(player, data) {
    super("Tinkerer", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "EnqueueVisitors",
      "DayShooter",
    ];
  }
};
