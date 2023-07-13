const Role = require("../../Role");

module.exports = class Tagger extends Role {
  constructor(player, data) {
    super("Tagger", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "CheckIfVisitIsSuccessful",
    ];
  }
};
