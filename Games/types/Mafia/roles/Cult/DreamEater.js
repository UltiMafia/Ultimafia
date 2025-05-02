const Role = require("../../Role");

module.exports = class DreamEater extends Role {
  constructor(player, data) {
    super("Dream Eater", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "HauntDreams",
      "NightKiller",
    ];
    this.meetingMods = {
      "Solo Kill": {
        actionName: "Rip Apart",
        targets: { include: ["alive"] },
      },
    };
  }
};
