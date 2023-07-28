const Role = require("../../Role");

module.exports = class Inventor extends Role {
  constructor(player, data) {
    super("Inventor", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ForageItem"];
  }
};
