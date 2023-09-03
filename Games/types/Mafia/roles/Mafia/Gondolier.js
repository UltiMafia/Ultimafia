const Role = require("../../Role");

module.exports = class Gondolier extends Role {
  constructor(player, data) {
    super("Gondolier", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "RedirectAction",
    ];

    this.meetingMods = {
      "Control Actor": {
        actionName: "Choose Passenger",
      },
      "Redirect to Target": {
        actionName: "Bring passenger to",
      },
    };
  }
};
