const Role = require("../../Role");

module.exports = class Don extends Role {
  constructor(player, data) {
    super("Don", player, data);

    this.alignment = "Mafia";
    this.overturnsLeft = 1;
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "OverturnVote",
      "AddDusk",
    ];
  }
};
