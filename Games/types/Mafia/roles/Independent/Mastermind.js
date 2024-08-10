const Role = require("../../Role");

module.exports = class Mastermind extends Role {
  constructor(player, data) {
    super("Mastermind", player, data);

    this.alignment = "Independent";
    this.winCount = "Mafia";
    this.cards = [
      "VillageCore",
      "MeetingMafia",
      "WinInsteadOfMafiaAndCult",
      "AnonymizeMafia",
      "MeetingCult",
      "AnonymizeCult"
    ];
  }
};

//"WinInsteadOfCult",