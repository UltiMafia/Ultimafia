const Role = require("../../Role");

module.exports = class FemmeFatale extends Role {
  constructor(player, data) {
    super("Femme Fatale", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ProposeKill"];
  }
};
