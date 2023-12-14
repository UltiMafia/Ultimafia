const Role = require("../../Role");

module.exports = class Snitch extends Role {
  constructor(player, data) {
    super("Snitch", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "DeflectAction",
    ];

    this.meetingMods = {
      "Redirect Action From": {
        actionName: "Divert Attention From",
      },
      "Redirect Action To": {
        actionName: "Snitch On",
      },
    };
  }
};
