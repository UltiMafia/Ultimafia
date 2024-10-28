const Role = require("../../Role");

module.exports = class Zoner extends Role {
  constructor(player, data) {
    super("Zoner", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinWithDeadNeighbors"];
  }
};
