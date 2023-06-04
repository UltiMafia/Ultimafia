const Role = require("../../Role");

module.exports = class Forager extends Role {
  constructor(player, data) {
    super("Forager", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ForageItem"];
  }
};
