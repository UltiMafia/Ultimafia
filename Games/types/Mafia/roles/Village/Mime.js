const Role = require("../../Role");

module.exports = class Mime extends Role {
  constructor(player, data) {
    super("Mime", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MimicRole"];
  }
};
