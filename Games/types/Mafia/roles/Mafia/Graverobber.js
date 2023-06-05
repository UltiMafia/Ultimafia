const Role = require("../../Role");

module.exports = class Graverobber extends Role {
  constructor(player, data) {
    super("Graverobber", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "RobGrave"];
  }
};
