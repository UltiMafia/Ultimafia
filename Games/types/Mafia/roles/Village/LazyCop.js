const Role = require("../../Role");

module.exports = class LazyCop extends Role {
  constructor(player, data) {
    super("Lazy Cop", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "AlignmentLearnerDelayed",
      "AppearAsCop",
    ];
  }
};
