const Role = require("../../Role");

module.exports = class Granny extends Role {
  constructor(player, data) {
    super("Granny", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "ConvertImmune",
      "KillImmune",
      "KillVisitors",
    ];
  }
};
