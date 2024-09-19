const Role = require("../../Role");

module.exports = class Historian extends Role {
  constructor(player, data) {
    super("Historian", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "ReceiveAllReports"];
    this.meetingMods = {
      ReceiveAllReports: {
        actionName: "Check Records",
      },
    };
  }
};
