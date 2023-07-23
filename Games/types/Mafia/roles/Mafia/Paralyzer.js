const Role = require("../../Role");

module.exports = class Paralyzer extends Role {
  constructor(player, data) {
    super("Paralyzer", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "ParalyzeAll"];
  }
};
