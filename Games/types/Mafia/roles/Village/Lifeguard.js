const Role = require("../../Role");

module.exports = class Lifeguard extends Role {
  constructor(player, data) {
    super("Lifeguard", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "VoteToBlockVotes",
    ];
  }
};
