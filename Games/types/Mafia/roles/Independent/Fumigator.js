const Role = require("../../Role");

module.exports = class Fumigator extends Role {
  constructor(player, data) {
    super("Fumigator", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinWithDeadNeighbors"];
  }
};
