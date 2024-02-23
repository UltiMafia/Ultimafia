const Role = require("../../Role");

module.exports = class Pathologist extends Role {
  constructor(player, data) {
    super("Pathologist", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ReceiveAllVisitors"];
    this.meetingMods = {
      ReceiveAllVisitors: {
        actionName: "Autopsy",
      },
    };
  }
};
