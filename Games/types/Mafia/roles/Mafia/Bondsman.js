const Role = require("../../Role");

module.exports = class Bondsman extends Role {
  constructor(player, data) {
    super("Bondsman", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "GuessRole"];
  }
};
