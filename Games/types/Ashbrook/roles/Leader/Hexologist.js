const Role = require("../../Role");

module.exports = class Hexologist extends Role {
  constructor(player, data) {
    super("Hexologist", player, data);

    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "EvilWinsAllHexed", "CanHex"];
  }
};
