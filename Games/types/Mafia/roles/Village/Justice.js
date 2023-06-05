const Role = require("../../Role");

module.exports = class Justice extends Role {
  constructor(player, data) {
    super("Justice", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CompareAlignments"];
  }
};
