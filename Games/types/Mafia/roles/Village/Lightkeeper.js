const Role = require("../../Role");

module.exports = class Lightkeeper extends Role {
  constructor(player, data) {
    super("Lightkeeper", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "EclipseOnDeath"];
  }
};
