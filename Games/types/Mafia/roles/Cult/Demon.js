const Role = require("../../Role");

module.exports = class Demon extends Role {
  constructor(player, data) {
    super("Demon", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "RedirectVisitorsToTarget"];
    this.meetingMods = {
      "Redirect Visitors To": {
        actionName: "Possess",
      },
    }
  }
};
