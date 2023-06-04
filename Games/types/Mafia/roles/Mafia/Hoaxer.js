const Role = require("../../Role");

module.exports = class Hoaxer extends Role {
  constructor(player, data) {
    super("Hoaxer", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "Storyteller"];
    this.meetingMods = {
      "Compose Story": {
        actionName: "Compose Hoax",
      },
      "Tell Story": {
        actionName: "Spread Hoax",
      },
    };
  }
};
