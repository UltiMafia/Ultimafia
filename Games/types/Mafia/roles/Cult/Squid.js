const Role = require("../../Role");

module.exports = class Squid extends Role {
  constructor(player, data) {
    super("Squid", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "Endangered",
      "MindRotNeighbors",
      "NightKiller",
    ];
    this.meetingMods = {
      "Solo Kill": {
        targets: { include: ["alive"], exclude: ["Cult"] },
      },
    };
  }
};
