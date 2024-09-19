const Role = require("../../Role");

module.exports = class Coward extends Role {
  constructor(player, data) {
    super("Coward", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "RedirectVisitorsToTarget"];
    this.meetingMods = {
      "Redirect Visitors To": {
        actionName: "Cower Behind",
      },
    };
  }
};
