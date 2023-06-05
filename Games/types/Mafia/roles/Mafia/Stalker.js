const Role = require("../../Role");

module.exports = class Stalker extends Role {
  constructor(player, data) {
    super("Stalker", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "RoleLearner"];
  }
};
