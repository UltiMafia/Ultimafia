const Role = require("../../Role");

module.exports = class Prankster extends Role {
  constructor(player, data) {
    super("Prankster", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "Pranked"];
  }
};
