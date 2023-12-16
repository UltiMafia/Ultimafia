const Role = require("../../Role");

module.exports = class Painter extends Role {
  constructor(player, data) {
    super("Painter", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "PaintPortraits"];
  }
};
