const Role = require("../../Role");

module.exports = class Janitor extends Role {
  constructor(player, data) {
    super("Janitor", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "CleanDeath"];
  }
};
