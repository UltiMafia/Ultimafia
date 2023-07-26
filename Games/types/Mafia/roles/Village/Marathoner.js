const Role = require("../../Role");

module.exports = class Marathoner extends Role {
  constructor(player, data) {
    super("Marathoner", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "VisitEveryone"];
  }
};