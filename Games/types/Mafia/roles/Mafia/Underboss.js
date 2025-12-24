const Role = require("../../Role");

module.exports = class Underboss extends Role {
  constructor(player, data) {
    super("Underboss", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MakePlayerLeadGroupActions",
    ];
  }
};
