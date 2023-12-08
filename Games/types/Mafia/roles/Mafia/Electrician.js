const Role = require("../../Role");

module.exports = class Electrician extends Role {
  constructor(player, data) {
    super("Electrician", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "BlindAll"];
  }
};
