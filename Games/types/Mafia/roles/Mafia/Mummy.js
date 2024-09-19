const Role = require("../../Role");

module.exports = class Mummy extends Role {
  constructor(player, data) {
    super("Mummy", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "KillVisitorsWhileDead",
    ];
  }
};
