const Role = require("../../Role");

module.exports = class Charlatan extends Role {
  constructor(player, data) {
    super("Charlatan", player, data);

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
