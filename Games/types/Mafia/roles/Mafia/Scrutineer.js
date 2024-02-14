const Role = require("../../Role");

module.exports = class Scrutineer extends Role {
  constructor(player, data) {
    super("Scrutineer", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "CurseVote"];
  }
};
