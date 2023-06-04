const Role = require("../../Role");

module.exports = class Crafter extends Role {
  constructor(player, data) {
    super("Crafter", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveAnyItem"];
  }
};
