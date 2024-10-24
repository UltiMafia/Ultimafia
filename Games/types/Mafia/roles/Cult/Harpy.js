const Role = require("../../Role");

module.exports = class Harpy extends Role {
  constructor(player, data) {
    super("Harpy", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GiveVotingMadness",
    ];
  }
};
