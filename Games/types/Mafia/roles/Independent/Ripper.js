const Role = require("../../Role");

module.exports = class Ripper extends Role {
  constructor(player, data) {
    super("Ripper", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "NightKiller", "WinAloneHarmfulIndependent"];
  }
};
