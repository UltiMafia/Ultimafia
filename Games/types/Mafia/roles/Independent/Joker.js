const Role = require("../../Role");

module.exports = class Joker extends Role {
  constructor(player, data) {
    super("Joker", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfNightKilled"];
  }
};
