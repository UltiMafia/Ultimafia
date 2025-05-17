const Role = require("../../Role");

module.exports = class Syllara extends Role {
  constructor(player, data) {
    super("Syllara", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "VotingWord",
    ];
  }
};
