const Role = require("../../Role");

module.exports = class Jeweler extends Role {
  constructor(player, data) {
    super("Jeweler", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RingGiver"];
  }
};
