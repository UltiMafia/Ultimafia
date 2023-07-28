const Role = require("../../Role");

module.exports = class Justice extends Role {
  constructor(player, data) {
    super("Justice", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "CompareAlignments"];
  }
};
