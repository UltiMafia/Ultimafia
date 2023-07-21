const Role = require("../../Role");

module.exports = class Ripper extends Role {
  constructor(player, data) {
    super("Ripper", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "NightKiller", "WinAloneHarmfulIndependent"];
  }
};