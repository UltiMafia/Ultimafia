const Role = require("../../Role");

module.exports = class Craftsman extends Role {
  constructor(player, data) {
    super("Craftsman", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveAnyItem"];
  }
};
