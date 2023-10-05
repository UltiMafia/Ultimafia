const Role = require("../../Role");

module.exports = class Cop extends Role {
  constructor(player, data) {
    super("Cop", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "AlignmentLearner"];
  }
};
