const Role = require("../../Role");

module.exports = class Arbiter extends Role {
  constructor(player, data) {
    super("Arbiter", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ArbiterVotes",
    ];
    this.data.VoteLog = [];
  }
};