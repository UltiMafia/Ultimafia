const Role = require("../../Role");

module.exports = class Coward extends Role {
  constructor(player, data) {
    super("Coward", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RedirectVisitorsToTarget"];
    this.meetingMods = {
      "Redirect Visitors To": {
        actionName: "Cower Behind",
      },
    }
  }
};
