const Role = require("../../Role");

module.exports = class Gunrunner extends Role {
  constructor(player, data) {
    super("Gunrunner", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "GiveTommyGun",
    ];
  }
};
