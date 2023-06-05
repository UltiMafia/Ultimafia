const Role = require("../../Role");

module.exports = class Seer extends Role {
  constructor(player, data) {
    super("Seer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SeeRole"];
  }
};
