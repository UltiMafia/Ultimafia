const Role = require("../../Role");

module.exports = class Geologist extends Role {
  constructor(player, data) {
    super("Geologist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "EvilDistance"];
  }
};
