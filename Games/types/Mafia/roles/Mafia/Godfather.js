const Role = require("../../Role");

module.exports = class Godfather extends Role {
  constructor(player, data) {
    super("Godfather", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "VillagerToInvestigative",
    ];
  }
};
