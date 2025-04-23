const Role = require("../../Role");

module.exports = class Glider extends Role {
  constructor(player, data) {
    super("Glider", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "GliderConvert", "WinWithGliders"];
  }
};
