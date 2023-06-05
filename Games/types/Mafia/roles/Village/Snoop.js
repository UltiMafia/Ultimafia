const Role = require("../../Role");

module.exports = class Snoop extends Role {
  constructor(player, data) {
    super("Snoop", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SnoopItems"];
  }
};
