const Role = require("../../Role");

module.exports = class Crank extends Role {
  constructor(player, data) {
    super("Crank", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "SeanceTarget"];
  }
};
