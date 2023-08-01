const Role = require("../../Role");

module.exports = class Clockmaker extends Role {
  constructor(player, data) {
    super("Clockmaker", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "NightKiller", "WinAtMidnight"];
  }
};
