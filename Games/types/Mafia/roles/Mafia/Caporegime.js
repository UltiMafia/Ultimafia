const Role = require("../../Role");

module.exports = class Caporegime extends Role {
  constructor(player, data) {
    super("Caporegime", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "KillTargetIfVisited",
    ];
  }
};
