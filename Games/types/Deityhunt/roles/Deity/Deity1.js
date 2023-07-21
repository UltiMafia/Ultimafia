const Role = require("../../Role");

module.exports = class Deity1 extends Role {
  constructor(player, data) {
    super("Deity1", player, data);
    this.alignment = "Deity";
    this.cards = ["VillageCore", "WinWithEvil", "NightKillerDeity1"];
  }
};
