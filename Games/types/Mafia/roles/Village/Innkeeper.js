const Role = require("../../Role");

module.exports = class Innkeeper extends Role {
  constructor(player, data) {
    super("Innkeeper", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SaveTwoAndMindRot"];
  }
};
