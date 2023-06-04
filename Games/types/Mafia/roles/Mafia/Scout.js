const Role = require("../../Role");

module.exports = class Scout extends Role {
  constructor(player, data) {
    super("Scout", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "TrackPlayer"];
  }
};
