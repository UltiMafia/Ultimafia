const Role = require("../../Role");

module.exports = class Savant extends Role {
  constructor(player, data) {
    super("Savant", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "LearnTrueAndFalse"];
  }
};
