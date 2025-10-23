const Role = require("../../Role");

module.exports = class Dentist extends Role {
  constructor(player, data) {
    super("Dentist", player, data);

    this.alignment = "Mafia";
    this.cards = [
    "VillageCore", 
    "NightGasser",
    "WinWithFaction",
    "MeetingFaction"
    ];
  }
};
