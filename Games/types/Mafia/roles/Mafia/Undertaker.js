const Role = require("../../Role");

module.exports = class Undertaker extends Role {
  constructor(player, data) {
    super("Undertaker", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "CleanCondemnation"];
  }
};
