const Role = require("../../Role");

module.exports = class Betrothed extends Role {
  constructor(player, data) {
    super("Betrothed", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BetrothedSenses"];
  }
};
