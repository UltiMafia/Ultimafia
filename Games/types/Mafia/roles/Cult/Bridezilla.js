const Role = require("../../Role");

module.exports = class Bridezilla extends Role {
  constructor(player, data) {
    super("Bridezilla", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ProposeConversion"];
  }
};
