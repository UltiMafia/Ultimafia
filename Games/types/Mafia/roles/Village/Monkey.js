const Role = require("../../Role");

module.exports = class Monkey extends Role {
  constructor(player, data) {
    super("Monkey", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "StealActions"];
  }
};
