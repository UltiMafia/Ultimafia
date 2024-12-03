const Role = require("../../Role");

module.exports = class Gondolier extends Role {
  constructor(player, data) {
    super("Gondolier", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "RedirectAction",
    ];

    this.meetingMods = {
      "Control Actor": {
        actionName: "Choose Passenger",
      },
      "Redirect to Target": {
        actionName: "Bring passenger to (Not a Visit)",
      },
    };
  }
};
