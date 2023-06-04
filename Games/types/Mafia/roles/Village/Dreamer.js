const Role = require("../../Role");

module.exports = class Dreamer extends Role {
  constructor(player, data) {
    super("Dreamer", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Dream"];
  }
};
