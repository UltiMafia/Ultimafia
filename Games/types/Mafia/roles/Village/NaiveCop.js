const Role = require("../../Role");

module.exports = class NaiveCop extends Role {
  constructor(player, data) {
    super("Naive Cop", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "AlignmentLearner",
      "AppearAsCop",
    ];
  }
};
