const Role = require("../../Role");

module.exports = class Snowman extends Role {
  constructor(player, data) {
    super("Pharmacist", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "GiveSedative",
      "SedativeImmune",
    ];
  }
};
