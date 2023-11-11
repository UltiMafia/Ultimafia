const Role = require("../../Role");

module.exports = class Bowyer extends Role {
  constructor(player, data) {
    super("Bowyer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveCrossbow"];
  }
};
