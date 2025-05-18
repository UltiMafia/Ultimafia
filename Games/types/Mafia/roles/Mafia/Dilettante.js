const Role = require("../../Role");

module.exports = class Dilettante extends Role {
  constructor(player, data) {
    super("Dilettante", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "VotingWord",
    ];
  }
};
