const Role = require("../../Role");

module.exports = class Detective extends Role {
  constructor(player, data) {
    super("Detective", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnRole",
    ];
    this.meetingMods = {
      "Learn Role": {
        actionName: "Background Check",
      },
    };
  }
};
