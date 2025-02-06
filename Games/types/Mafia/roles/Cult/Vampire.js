const Role = require("../../Role");

module.exports = class Vampire extends Role {
  constructor(player, data) {
    super("Vampire", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "VampireKill",
      "VampireSetup",
      //"VampireVotes",
      "VampireAppearAsRoles",
    ];
    this.meetingMods = {
      Village: {
        voteWeight: 0.01,
      },
      "Magus Game": {
        voteWeight: 0.01,
      },
    };
  }
};
