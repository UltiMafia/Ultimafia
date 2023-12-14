const Role = require("../../Role");

module.exports = class Recruiter extends Role {
  constructor(player, data) {
    super("Recruiter", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "GuessRole"];
  }
};
