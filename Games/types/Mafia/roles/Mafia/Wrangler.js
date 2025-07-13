const Role = require("../../Role");

module.exports = class Wrangler extends Role {
  constructor(player, data) {
    super("Wrangler", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnRoleIfTargetIsFirstToVote",
    ];
  }
};
