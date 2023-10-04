const Role = require("../../Role");

module.exports = class Librarian extends Role {
  constructor(player, data) {
    super("Librarian", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "Library"];
  }
};
