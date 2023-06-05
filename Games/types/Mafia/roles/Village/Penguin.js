const Role = require("../../Role");

module.exports = class Penguin extends Role {
  constructor(player, data) {
    super("Penguin", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "WaddleAndTellSecret"];
  }
};
