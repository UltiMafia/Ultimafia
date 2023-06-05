const Role = require("../../Role");

module.exports = class Housekeeper extends Role {
  constructor(player, data) {
    super("Housekeeper", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "KeepHouse"];
  }
};
