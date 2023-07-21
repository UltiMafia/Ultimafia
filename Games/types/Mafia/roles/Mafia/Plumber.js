const Role = require("../../Role");

module.exports = class Plumber extends Role {
  constructor(player, data) {
    super("Plumber", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "LeakTarget"];
  }
};