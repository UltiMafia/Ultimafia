const Role = require("../../Role");

module.exports = class Scrambler extends Role {
  constructor(player, data) {
    super("Scrambler", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "Scrambler"];
  }
};
