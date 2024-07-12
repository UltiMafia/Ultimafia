const Role = require("../../Role");

module.exports = class Analyst extends Role {
  constructor(player, data) {
    super("Appraiser", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "EvilPairs"];
  }
};
