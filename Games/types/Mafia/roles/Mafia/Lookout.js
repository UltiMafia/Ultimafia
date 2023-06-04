const Role = require("../../Role");

module.exports = class Lookout extends Role {
  constructor(player, data) {
    super("Lookout", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "WatchPlayer"];
  }
};
