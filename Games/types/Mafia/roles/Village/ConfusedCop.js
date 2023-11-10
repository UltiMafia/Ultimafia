const Role = require("../../Role");

module.exports = class ConfusedCop extends Role {
  constructor(player, data) {
    super("Confused Cop", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "AlignmentLearner",
      "AppearAsCop",
    ];
  }
};
