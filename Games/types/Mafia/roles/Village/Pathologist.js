const Role = require("../../Role");

module.exports = class Pathologist extends Role {
  constructor(player, data) {
    super("Pathologist", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ReceiveAllReports",
    ];
    this.meetingMods = {
      ReceiveAllReports: {
        actionName: "Autopsy",
      },
    };
  }
};
