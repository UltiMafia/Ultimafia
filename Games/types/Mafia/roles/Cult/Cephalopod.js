const Role = require("../../Role");

module.exports = class Cephalopod extends Role {
  constructor(player, data) {
    super("Cephalopod", player, data);

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
