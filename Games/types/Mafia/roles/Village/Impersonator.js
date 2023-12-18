const Role = require("../../Role");

module.exports = class Impersonator extends Role {
  constructor(player, data) {
    super("Impersonator", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ImitateRole"];
  }
};
