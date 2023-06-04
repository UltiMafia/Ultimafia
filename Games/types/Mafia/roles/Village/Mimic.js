const Role = require("../../Role");

module.exports = class Mimic extends Role {
  constructor(player, data) {
    super("Mimic", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MimicRole"];
  }
};
