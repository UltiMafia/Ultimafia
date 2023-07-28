const Role = require("../../Role");

module.exports = class Hierophant extends Role {
  constructor(player, data) {
    super("Hierophant", player, data);
    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "NightKillerHierophant"];
  }
};
