const Role = require("../../Role");

module.exports = class Historian extends Role {
  constructor(player, data) {
    super("Historian", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ReceiveAllReports"];
    this.meetingMods = {
      ReceiveAllReports: {
        actionName: "Autopsy",
      },
    };
  }
};
