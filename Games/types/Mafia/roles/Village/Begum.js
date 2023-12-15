const Role = require("../../Role");

module.exports = class Begum extends Role {
  constructor(player, data) {
    super("Begum", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "PsychesSenses"];
  }
};
