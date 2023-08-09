const Role = require("../../Role");

module.exports = class Loudmouth extends Role {
  constructor(player, data) {
    super("Loudmouth", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "Humble",
      "CryOutVisitors",
      "AllWhispersLeak",
    ];
    this.immunity["silence"] = 1;
  }
};
