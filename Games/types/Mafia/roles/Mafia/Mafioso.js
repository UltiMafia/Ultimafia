const Role = require("../../Role");

module.exports = class Mafioso extends Role {
  constructor(player, data) {
    super("Mafioso", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia"];
  }
};
