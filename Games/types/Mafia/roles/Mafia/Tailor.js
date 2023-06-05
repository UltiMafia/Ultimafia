const Role = require("../../Role");

module.exports = class Tailor extends Role {
  constructor(player, data) {
    super("Tailor", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "TailorSuit"];
  }
};
