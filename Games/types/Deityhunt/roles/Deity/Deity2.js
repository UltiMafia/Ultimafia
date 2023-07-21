const Role = require("../../Role");

module.exports = class Deity2 extends Role {
  constructor(player, data) {
    super("Deity2", player, data);
    this.alignment = "Deity";
    this.cards = ["VillageCore", "WinWithEvil", "NightKillerDeity2"];
  }
};
