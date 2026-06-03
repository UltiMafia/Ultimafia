const Role = require("../../Role");

module.exports = class Morgana extends Role {
  constructor(player, data) {
    super("Morgana", player, data);

    this.alignment = "Mafia";
    this.appearance.percival = "Seer";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "VillagerToInvestigative",
    ];
  }
};
