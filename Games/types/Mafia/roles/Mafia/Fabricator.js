const Role = require("../../Role");

module.exports = class Fabricator extends Role {
  constructor(player, data) {
    super("Fabricator", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction",  "BrokenWares"];
  }
};
