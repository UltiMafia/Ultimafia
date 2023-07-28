const Role = require("../../Role");

module.exports = class Lightkeeper extends Role {
  constructor(player, data) {
    super("Lightkeeper", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "EclipseOnDeath"];
  }
};
