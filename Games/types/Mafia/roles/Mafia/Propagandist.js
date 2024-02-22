const Role = require("../../Role");

module.exports = class Propagandist extends Role {
  constructor(player, data) {
    super("Propagandist", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "ReceiveAllReports",
    ];
    this.meetingMods = {
      ReceiveAllReports: {
        actionName: "Check Records",
      },
    };
  }
};