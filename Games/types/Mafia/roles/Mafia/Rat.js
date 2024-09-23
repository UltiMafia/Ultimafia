const Role = require("../../Role");

module.exports = class Rat extends Role {
  constructor(player, data) {
    super("Rat", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "RedirectVisitorsToTarget",
    ];
    this.meetingMods = {
      "Redirect Visitors To": {
        actionName: "Rat On",
      },
    };
  }
};
