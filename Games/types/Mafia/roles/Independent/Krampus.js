const Role = require("../../Role");

module.exports = class Krampus extends Role {
  constructor(player, data) {
    super("Krampus", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinWithDesiredItem", "KrampusPresents"];
  }
};
