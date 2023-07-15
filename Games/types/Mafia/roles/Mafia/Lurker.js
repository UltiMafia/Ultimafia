const Role = require("../../Role");

module.exports = class Lurker extends Role {
  constructor(player, data) {
    super("Lurker", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "TrackPlayerBoolean",
    ];
    this.meetingMods = {
      "Track (Boolean)": {
        actionName: "Observe for visits",
      },
    };
  }
};
